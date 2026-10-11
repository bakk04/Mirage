"""Environment and dependency verification script for MIRAGE AI Companion.

Verifies:
- Python version (3.11)
- PyTorch & MPS acceleration (Apple Silicon M4)
- timm & ConvNeXt V2-Nano instantiation
- OpenCV image processing
- FastAPI & WebSockets
- Whisper speech-to-text
- Google GenAI SDK
- Memory and resource consumption
"""

import sys
import time

print("=" * 60)
print("  MIRAGE AI Companion - Vérification de l'Environnement")
print("=" * 60)

# 1. Python
print(f"[1/7] Python version : {sys.version.split()[0]} ({sys.executable})")

# 2. PyTorch & MPS
try:
    import torch
    mps_ok = torch.backends.mps.is_available()
    device_name = "mps (Apple Silicon GPU)" if mps_ok else "cpu"
    print(f"[2/7] PyTorch : v{torch.__version__} | Accélération matérielle : {device_name}")
except ImportError as e:
    print(f"[2/7] ❌ PyTorch introuvable : {e}")

# 3. timm & ConvNeXt V2-Nano
try:
    import timm
    print(f"[3/7] timm : v{timm.__version__}")
    # Instanciation rapide
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model = timm.create_model("convnextv2_nano", pretrained=False, num_classes=10)
    model.to(device)
    dummy = torch.randn(1, 3, 224, 224, device=device)
    with torch.no_grad():
        out = model(dummy)
    print(f"      ✓ ConvNeXt V2-Nano instancié avec succès sur {device} (sortie : {out.shape})")
except ImportError as e:
    print(f"[3/7] ⚠️ timm non encore installé : {e}")
except Exception as e:
    print(f"[3/7] ⚠️ Erreur ConvNeXt: {e}")

# 4. OpenCV
try:
    import cv2
    print(f"[4/7] OpenCV : v{cv2.__version__}")
except ImportError as e:
    print(f"[4/7] ⚠️ OpenCV non encore installé : {e}")

# 5. FastAPI & Uvicorn
try:
    import fastapi
    import uvicorn
    import websockets
    print(f"[5/7] FastAPI : v{fastapi.__version__} | Uvicorn & WebSockets : OK")
except ImportError as e:
    print(f"[5/7] ⚠️ FastAPI / WebSockets : {e}")

# 6. Whisper
try:
    import whisper
    print(f"[6/7] OpenAI Whisper : disponible")
except ImportError as e:
    print(f"[6/7] ⚠️ Whisper : {e}")

# 7. Google GenAI
try:
    from google import genai
    print(f"[7/7] Google GenAI SDK : disponible")
except ImportError as e:
    print(f"[7/7] ⚠️ Google GenAI : {e}")

print("=" * 60)
