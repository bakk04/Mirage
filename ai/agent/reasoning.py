"""Reasoning module with Gemini API via google-genai SDK.

Combines CNN vision output, conversation memory, and user question
into a prompt to produce contextual, companion-like responses.
"""

import os
from typing import Optional


class MirageAgent:
    """Agent multimodal Mirage combinant vision, mémoire et LLM."""

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

    def generate_response(
        self,
        user_message: str,
        detected_label: Optional[str] = None,
        confidence: Optional[float] = None,
        memory_context: Optional[str] = None,
    ) -> str:
        """Génère une réponse intelligente basée sur le contexte visuel et la mémoire."""
        if not self._client:
            # Fallback local informatif si pas de clé API ou client non initialisé
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
            prompt_parts.append(f"Actuellement, ta vision caméra (CNN ConvNeXt V2) observe : '{detected_label}'{conf_str}.")

        if memory_context:
            prompt_parts.append(f"Mémoire des événements récents :\n{memory_context}")

        prompt_parts.append(f"L'utilisateur te dit : \"{user_message}\"")
        prompt_parts.append("Ta réponse :")

        full_prompt = "\n\n".join(prompt_parts)

        try:
            # Appel API Gemini 2.5 Flash (rapide, léger, économique)
            response = self._client.models.generate_content(
                model="gemini-2.5-flash",
                contents=full_prompt,
            )
            return response.text.strip() if response.text else "Je n'ai pas pu formuler de réponse."
        except Exception as e:
            return f"Désolé, une erreur est survenue lors de l'appel à Gemini : {e}"
