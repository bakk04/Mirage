"""Text-to-Speech (TTS) module for MIRAGE AI Companion.

Supports:
- ElevenLabs API for human-like natural voice
- macOS 'say' command (0 latency, 0 download, works offline)
- Browser Web Speech API payload (for frontend execution)
"""

import subprocess
import os
import requests
from typing import Optional

from backend.config import TTS_PROVIDER, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID


class TextToSpeech:
    """Gestionnaire de synthèse vocale multi-moteurs."""

    def __init__(self):
        self.provider = TTS_PROVIDER
        self.elevenlabs_key = ELEVENLABS_API_KEY
        self.voice_id = ELEVENLABS_VOICE_ID

    def speak_macos(self, text: str) -> bool:
        """Utilise la commande système native macOS 'say'."""
        try:
            subprocess.Popen(["say", text])
            return True
        except Exception as e:
            print(f"[TTS] Erreur macos say: {e}")
            return False

    def synthesize_elevenlabs(self, text: str) -> Optional[bytes]:
        """Génère un flux audio MP3 via l'API ElevenLabs."""
        if not self.elevenlabs_key:
            return None
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.elevenlabs_key,
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        }
        try:
            response = requests.post(url, json=data, headers=headers, timeout=10)
            if response.status_code == 200:
                return response.content
        except Exception as e:
            print(f"[TTS] Erreur ElevenLabs API: {e}")
        return None
