"""Creative imagination module for MIRAGE AI Companion.

Generates imaginative scenes based on visual CNN detections and conversational context.
Supports:
- Hugging Face Inference API (Flux.1-schnell / SDXL) via HF_TOKEN
- Stability AI API via STABILITY_API_KEY
- Resilient local SVG fallback for instant response without crashing or network dependencies.
"""

import base64
import os
from typing import Optional
import requests

from backend.config import (
    IMAGE_PROVIDER,
    HF_TOKEN,
    STABILITY_API_KEY,
    GEMINI_API_KEY,
)

# Image vectorielle de secours instantanée (SVG encodé base64)
FALLBACK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="#0f172a" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="1"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#grad)"/>
  <circle cx="256" cy="256" r="120" stroke="#818cf8" stroke-width="2" fill="none" opacity="0.6"/>
  <circle cx="256" cy="256" r="80" stroke="#38bdf8" stroke-width="3" fill="none" filter="url(#glow)"/>
  <circle cx="256" cy="256" r="16" fill="#38bdf8" filter="url(#glow)"/>
  <text x="256" y="420" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" letter-spacing="2">MIRAGE CREATIVE ENGINE</text>
  <text x="256" y="445" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="12">[MODE SECOURS LOCAL - DÉMO]</text>
</svg>"""

FALLBACK_DATA_URL = f"data:image/svg+xml;base64,{base64.b64encode(FALLBACK_SVG.encode()).decode()}"


class CreativeModule:
    """Génération créative d'images multimodale avec gestion multi-API."""

    def __init__(self):
        self.provider = IMAGE_PROVIDER
        self.hf_token = HF_TOKEN
        self.stability_key = STABILITY_API_KEY
        self.gemini_key = GEMINI_API_KEY

    def _generate_with_hf(self, prompt: str) -> Optional[str]:
        """Appel à l'API Serverless Hugging Face (modèle ultra-rapide FLUX.1-schnell)."""
        if not self.hf_token:
            return None
        api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        try:
            resp = requests.post(api_url, headers=headers, json={"inputs": prompt}, timeout=12)
            if resp.status_code == 200:
                b64_img = base64.b64encode(resp.content).decode("utf-8")
                return f"data:image/jpeg;base64,{b64_img}"
        except Exception as e:
            print(f"[CreativeModule] Erreur Hugging Face API: {e}")
        return None

    def _generate_with_stability(self, prompt: str) -> Optional[str]:
        """Appel à l'API Stability AI."""
        if not self.stability_key:
            return None
        api_url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.stability_key}",
        }
        payload = {
            "text_prompts": [{"text": prompt, "weight": 1}],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }
        try:
            resp = requests.post(api_url, headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                b64 = data["artifacts"][0]["base64"]
                return f"data:image/png;base64,{b64}"
        except Exception as e:
            print(f"[CreativeModule] Erreur Stability API: {e}")
        return None

    def imagine_future(self, detected_label: Optional[str] = None, prompt: Optional[str] = None) -> dict:
        """Génère une image créative de la scène (avec fallback garanti)."""
        subject = detected_label or "cet objet"
        concept_prompt = (
            prompt
            or f"A poetic, futuristic, glowing concept art of a {subject} 20 years into the future, cyberpunk ambient lighting, 8k resolution"
        )

        image_url = None
        used_provider = "fallback"

        # 1. Tentative Hugging Face si configuré
        if self.provider in ("auto", "huggingface") and self.hf_token:
            image_url = self._generate_with_hf(concept_prompt)
            if image_url:
                used_provider = "huggingface"

        # 2. Tentative Stability si HF indisponible ou Stability demandé
        if not image_url and self.provider in ("auto", "stability") and self.stability_key:
            image_url = self._generate_with_stability(concept_prompt)
            if image_url:
                used_provider = "stability"

        # 3. Fallback local garanti (garantit qu'aucun crash n'a lieu en soutenance/démo)
        if not image_url:
            image_url = FALLBACK_DATA_URL
            used_provider = "fallback_local"

        return {
            "status": "success",
            "prompt": concept_prompt,
            "imageUrl": image_url,
            "provider": used_provider,
            "is_fallback": (used_provider == "fallback_local"),
        }
