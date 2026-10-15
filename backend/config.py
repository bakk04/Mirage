"""Configuration module for MIRAGE AI Companion.

Loads all system, model, and external API configurations from environment variables (.env).
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables depuis le fichier .env
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATASETS_DIR = BASE_DIR / "datasets"
EXPERIMENTS_DIR = BASE_DIR / "experiments"

# ==============================================================================
# 1. Configuration Réseau & Serveur FastAPI
# ==============================================================================
HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
PORT = int(os.getenv("BACKEND_PORT", "8000"))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:8443").split(",")
]

# ==============================================================================
# 2. Intelligence Artificielle & Raisonnement Multimodal (LLM)
# ==============================================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

# ==============================================================================
# 3. Vision par Ordinateur & CNN (ConvNeXt V2-Nano)
# ==============================================================================
def get_torch_device() -> str:
    """Détecte automatiquement le meilleur device (MPS sur Apple Silicon M-series, sinon CPU)."""
    try:
        import torch
        if torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"

DEVICE = os.getenv("DEVICE") or get_torch_device()
CNN_MODEL_NAME = os.getenv("CNN_MODEL_NAME", "convnextv2_nano")
NUM_CLASSES = int(os.getenv("NUM_CLASSES", "10"))
MODEL_CHECKPOINT = os.getenv("MODEL_CHECKPOINT", str(MODELS_DIR / "best_convnextv2_nano.pt"))

# Arabic Sign Language CNN (32 static ArSL alphabet/sign classes)
ARSL_MODEL_PATH = Path(os.getenv(
    "ARSL_MODEL_PATH",
    str(MODELS_DIR / "arabic_sign_mobilenetv2" / "arsl_cnn" / "asl_model.h5"),
))
ARSL_HAND_LANDMARKER_PATH = Path(os.getenv(
    "ARSL_HAND_LANDMARKER_PATH",
    str(MODELS_DIR / "arabic_sign_mobilenetv2" / "arsl_cnn" / "hand_landmarker.task"),
))

# MediaPipe Gesture Recognizer (for browser controls & hand gestures)
GESTURE_MODEL_PATH = Path(os.getenv(
    "GESTURE_MODEL_PATH",
    str(MODELS_DIR / "gesture_command_mediapipe" / "gesture_recognizer.task"),
))

# ==============================================================================
# 4. Reconnaissance Vocale (Speech-to-Text - STT)
# ==============================================================================
STT_PROVIDER = os.getenv("STT_PROVIDER", "local")  # "local" (Whisper base/tiny) ou "openai" (Cloud)
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ==============================================================================
# 5. Synthèse Vocale (Text-to-Speech - TTS)
# ==============================================================================
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "browser")  # "elevenlabs", "macos_say", "browser"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel par défaut

# ==============================================================================
# 6. Génération Créative d'Images
# ==============================================================================
IMAGE_PROVIDER = os.getenv("IMAGE_PROVIDER", "auto")  # "gemini", "huggingface", "stability", "auto"
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")
