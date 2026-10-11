"""Voice transcription module using OpenAI Whisper.

Supports 'tiny' (~75MB) and 'base' (~150MB) models.
Loads model lazily on demand to optimize memory and startup speed.
"""

from typing import Optional


class WhisperTranscriber:
    """Wrapper léger et paresseux (lazy-loaded) pour Whisper."""

    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self._model = None

    def _load_model(self):
        if self._model is None:
            import whisper
            print(f"[WhisperTranscriber] Chargement du modèle Whisper '{self.model_size}'...")
            self._model = whisper.load_model(self.model_size)

    def transcribe_audio_file(self, audio_path: str, language: Optional[str] = None) -> str:
        """Transcrit un fichier audio local (WAV, MP3, etc.)."""
        self._load_model()
        options = {}
        if language:
            options["language"] = language

        result = self._model.transcribe(audio_path, **options)
        return result.get("text", "").strip()

    def is_loaded(self) -> bool:
        return self._model is not None
