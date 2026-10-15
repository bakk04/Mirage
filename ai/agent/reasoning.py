"""Reasoning module with Gemini API via google-genai SDK.

Combines CNN vision output, conversation memory, and user question
into a prompt to produce contextual, companion-like responses.
Also provides fast ArSL letter-to-sentence reconstruction and
continuous sign video interpretation via Gemini multimodal models.
"""

from __future__ import annotations

import concurrent.futures
import io
import os
import re
import time
from typing import Any, Optional
from PIL import Image
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

# Fallback models in priority order
CANDIDATE_GEMINI_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
]

# Common Arabic sign language vocabulary for fast offline / fallback reconstruction
COMMON_ARSL_VOCAB: dict[str, str] = {
    "مرحبا": "مرحبا",
    "مرحب": "مرحبا",
    "شكرا": "شكرا",
    "شكر": "شكرا",
    "شكراجزيلا": "شكرا جزيلا",
    "كيفحالك": "كيف حالك",
    "كيف": "كيف",
    "حالك": "حالك",
    "السلامعليكم": "السلام عليكم",
    "سلام": "سلام",
    "صباحالخير": "صباح الخير",
    "مساءالخير": "مساء الخير",
    "معالسلامة": "مع السلامة",
    "نعم": "نعم",
    "لا": "لا",
    "انا": "أنا",
    "انت": "أنت",
    "احبك": "أحبك",
    "صديقي": "صديقي",
    "تمام": "تمام",
    "بخير": "بخير",
    "الحمدلله": "الحمد لله",
    "ساعدني": "ساعدني",
    "اسمي": "اسمي",
    "وداعا": "وداعا",
    "اهلا": "أهلاً",
    "اهلابك": "أهلاً بك",
}


def local_arabic_heuristic_assembler(letters: list[str]) -> str:
    """Intelligent offline assembler for Arabic fingerspelled letters.

    Cleans repeated letters, attaches joined letters, and matches common words.
    """
    if not letters:
        return ""

    # Clean consecutive duplicate frames (e.g. ['م', 'م', 'ر', 'ح', 'ح', 'ب', 'ا'] -> ['م', 'ر', 'ح', 'ب', 'ا'])
    clean_letters: list[str] = []
    for raw in letters:
        ch = str(raw).strip()
        if not ch:
            continue
        if clean_letters and clean_letters[-1] == ch:
            continue
        clean_letters.append(ch)

    if not clean_letters:
        return ""

    raw_joined = "".join(clean_letters)
    # Normalize alef / hamza variants for dictionary lookup
    norm_key = re.sub(r"[أإآ]", "ا", raw_joined)
    norm_key = re.sub(r"[ة]", "ه", norm_key)
    norm_key = re.sub(r"\s+", "", norm_key)

    if norm_key in COMMON_ARSL_VOCAB:
        return COMMON_ARSL_VOCAB[norm_key]

    # Try matching prefixes
    for k, phrase in sorted(COMMON_ARSL_VOCAB.items(), key=lambda x: -len(x[0])):
        if norm_key.startswith(k):
            rest = norm_key[len(k):]
            if not rest:
                return phrase
            return f"{phrase} {rest}"

    # Return directly joined Arabic word
    return raw_joined


class MirageAgent:
    """Agent multimodal Mirage combinant vision, mémoire et LLM Gemini."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self._client = None
        if self.api_key:
            self._init_client()

    def _init_client(self):
        try:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        except Exception as e:
            print(f"[MirageAgent] Impossible d'initialiser le client Gemini: {e}")
            self._client = None

    def _call_gemini_with_fallback(self, contents: Any, timeout_sec: float = 3.5) -> tuple[str, str]:
        """Calls Gemini with automated model fallback and strict timeout."""
        if not self._client:
            raise RuntimeError("Gemini client not initialized")

        def _single_call(model: str) -> str:
            res = self._client.models.generate_content(
                model=model,
                contents=contents,
            )
            return res.text.strip() if res and res.text else ""

        last_error = None
        seen_models = set()
        for model_name in CANDIDATE_GEMINI_MODELS:
            if not model_name or model_name in seen_models:
                continue
            seen_models.add(model_name)
            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(_single_call, model_name)
                    text = future.result(timeout=timeout_sec)
                    if text:
                        return text, model_name
            except Exception as exc:
                last_error = exc
                err_str = str(exc)
                if "503" in err_str or "404" in err_str or "NOT_FOUND" in err_str or "UNAVAILABLE" in err_str or "Timeout" in err_str:
                    continue
                # For critical auth or quota errors, try next or raise
                continue

        if last_error:
            raise last_error
        raise RuntimeError("No response returned from Gemini models")

    def reconstruct_arabic_sentence(
        self,
        letters: list[str] | str,
        context: Optional[str] = None,
    ) -> dict[str, Any]:
        """Reconstructs fingerspelled ArSL letters into a fluid, meaningful Arabic sentence.

        Uses Gemini 3.5 Flash Lite with instant fallback to a local Arabic assembler.
        """
        t0 = time.perf_counter()

        # Parse letters input
        if isinstance(letters, str):
            raw_tokens = [tok.strip() for tok in letters.split() if tok.strip()]
            joined_input = letters.strip()
        else:
            raw_tokens = [str(l).strip() for l in letters if str(l).strip()]
            joined_input = " ".join(raw_tokens)

        if not raw_tokens:
            return {
                "status": "empty",
                "sentence": "",
                "original_letters": "",
                "source": "none",
                "latency_ms": 0.0,
            }

        # Offline heuristic backup ready
        heuristic_res = local_arabic_heuristic_assembler(raw_tokens)

        if not self._client:
            latency_ms = (time.perf_counter() - t0) * 1000
            return {
                "status": "ok",
                "sentence": heuristic_res,
                "original_letters": joined_input,
                "source": "local_heuristic",
                "latency_ms": round(latency_ms, 2),
            }

        prompt = f"""Tu es un interprète officiel et traducteur expert en langue des signes arabe (ArSL - لغة الإشارة العربية).
Une personne sourde vient d'épeler une séquence de lettres ou de signes devant une caméra.
Ta mission : transformer ces lettres brutes en un mot ou une phrase complète en arabe naturel, correct et fluide, parfaitement adapté pour être prononcé à haute voix par une synthèse vocale (TTS).

Règles impératives :
1. Élimine les répétitions involontaires causées par le maintien de la main (ex: 'م م ر ح ح ب ا' -> 'مرحبا').
2. Reconstitue les mots séparés avec des espaces appropriés (ex: 'ك ي ف ح ا ل ك' -> 'كيف حالك').
3. Corrige intelligemment les approximations typiques de la dactylologie arabe.
4. Si la séquence forme une salutation ou phrase courante, restitue-la avec politesse et fluidité.
5. Rends UNIQUEMENT et STRICTEMENT le mot ou la phrase en arabe final.
6. Ne mets AUCUN guillemet, AUCUN astérisque (*), AUCUNE note, AUCUNE traduction en français/anglais.

Lettres détectées : {joined_input}
Phrase en arabe :"""

        try:
            raw_result, used_model = self._call_gemini_with_fallback(prompt, timeout_sec=3.0)
            clean_sentence = raw_result.strip().strip('"\'`*').strip()
            if "\n" in clean_sentence:
                clean_sentence = clean_sentence.split("\n")[-1].strip().strip('"\'`*')

            if not clean_sentence:
                clean_sentence = heuristic_res

            latency_ms = (time.perf_counter() - t0) * 1000
            return {
                "status": "ok",
                "sentence": clean_sentence,
                "original_letters": joined_input,
                "source": "gemini",
                "model": used_model,
                "latency_ms": round(latency_ms, 2),
            }
        except Exception as exc:
            latency_ms = (time.perf_counter() - t0) * 1000
            return {
                "status": "ok",
                "sentence": heuristic_res,
                "original_letters": joined_input,
                "source": "local_fallback",
                "error": str(exc),
                "latency_ms": round(latency_ms, 2),
            }

    def translate_sign_frames(
        self,
        frames: list[Image.Image],
        hint: Optional[str] = None,
    ) -> dict[str, Any]:
        """Translates a sequence of video frames showing Arabic Sign Language into Arabic text."""
        t0 = time.perf_counter()
        if not frames:
            return {"status": "error", "detail": "No frames provided"}
        if not self._client:
            return {"status": "error", "detail": "Gemini API client not initialized"}

        step = max(1, len(frames) // 8)
        sampled = frames[::step][:8]

        prompt_text = (
            "Tu es un traducteur expert en langue des signes arabe (ArSL).\n"
            "Voici une séquence vidéo d'une personne qui s'exprime en langue des signes.\n"
            "Interprète ces gestes et écris la phrase ou le mot arabe correspondant.\n"
            "Renvoie UNIQUEMENT la phrase en arabe, sans guillemets ni explications."
        )
        if hint:
            prompt_text += f"\nContexte : {hint}"

        contents: list[Any] = [prompt_text]
        for img in sampled:
            thumb = img.copy()
            thumb.thumbnail((448, 448))
            contents.append(thumb)

        try:
            raw_text, used_model = self._call_gemini_with_fallback(contents, timeout_sec=5.0)
            clean_sentence = raw_text.strip().strip('"\'`*').strip()
            latency_ms = (time.perf_counter() - t0) * 1000
            return {
                "status": "ok",
                "sentence": clean_sentence,
                "frames_count": len(sampled),
                "model": used_model,
                "latency_ms": round(latency_ms, 2),
            }
        except Exception as exc:
            latency_ms = (time.perf_counter() - t0) * 1000
            return {
                "status": "error",
                "detail": str(exc),
                "latency_ms": round(latency_ms, 2),
            }

    def generate_response(
        self,
        user_message: str,
        detected_label: Optional[str] = None,
        confidence: Optional[float] = None,
        memory_context: Optional[str] = None,
    ) -> str:
        """Génère une réponse intelligente basée sur le contexte visuel et la mémoire."""
        if not self._client:
            context_snippet = f" (Je vois un(e) {detected_label})" if detected_label else ""
            return (
                f"Je vous entends{context_snippet}. "
                f"[Mode démonstration locale : veuillez renseigner votre GEMINI_API_KEY dans le fichier .env "
                f"pour activer le raisonnement complet]."
            )

        prompt_parts = [
            "Tu es MIRAGE AI, un assistant compagnon visuel et empathique.",
            "Sois concis, chaleureux, naturel et direct (1 à 3 phrases courtes adaptées à une réponse vocale).",
        ]

        if detected_label:
            conf_str = f" ({confidence*100:.1f}%)" if confidence else ""
            prompt_parts.append(f"Actuellement, ta vision caméra (CNN) observe : '{detected_label}'{conf_str}.")

        if memory_context:
            prompt_parts.append(f"Mémoire des événements récents :\n{memory_context}")

        prompt_parts.append(f"L'utilisateur te dit : \"{user_message}\"")
        prompt_parts.append("Ta réponse :")

        full_prompt = "\n\n".join(prompt_parts)

        try:
            raw_res, _ = self._call_gemini_with_fallback(full_prompt, timeout_sec=4.0)
            return raw_res if raw_res else "Je n'ai pas pu formuler de réponse."
        except Exception as e:
            return f"Désolé, une erreur est survenue lors de l'appel à Gemini : {e}"
