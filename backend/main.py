"""FastAPI application for MIRAGE AI Companion.

Exposes REST and WebSocket endpoints for multimodal vision, voice,
short-term memory, and Gemini-based cognitive reasoning.
"""

import asyncio
import io
import json
import time
from typing import Optional
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

from backend.config import (
    DEVICE,
    CNN_MODEL_NAME,
    WHISPER_MODEL,
    GEMINI_MODEL,
    IMAGE_PROVIDER,
    TTS_PROVIDER,
    STT_PROVIDER,
    CORS_ORIGINS,
    ARSL_MODEL_PATH,
    ARSL_HAND_LANDMARKER_PATH,
)
from ai.memory.short_term import ShortTermMemory
from ai.agent.reasoning import MirageAgent
from ai.agent.creative import CreativeModule
from ai.voice.tts import TextToSpeech

app = FastAPI(
    title="MIRAGE AI Companion API",
    version="1.0.0",
    description="Multimodal companion backend powered by ConvNeXt V2-Nano, Whisper, and Gemini.",
)

# CORS middleware pour communiquer avec le frontend Vite / React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Composants globaux partagés
memory = ShortTermMemory(maxlen=30)
agent = MirageAgent()
creative = CreativeModule()
_predictor = None
_arsl_predictor = None


def get_predictor():
    """Charge le prédicteur CNN de manière paresseuse."""
    global _predictor
    if _predictor is None:
        try:
            from ai.cnn.model import VisionPredictor
            _predictor = VisionPredictor()
        except Exception as e:
            print(f"[Backend] Erreur chargement CNN: {e}")
            _predictor = None
    return _predictor


def get_arsl_predictor():
    """Lazily initialize the real Arabic-sign model only when requested."""
    global _arsl_predictor
    if _arsl_predictor is None:
        from ai.cnn.arsl import ArabicSignPredictor
        _arsl_predictor = ArabicSignPredictor(
            ARSL_MODEL_PATH,
            ARSL_HAND_LANDMARKER_PATH,
        )
    return _arsl_predictor


class ChatRequest(BaseModel):
    text: str
    detected_label: Optional[str] = None
    confidence: Optional[float] = None


class CreativeRequest(BaseModel):
    prompt: Optional[str] = None
    detected_label: Optional[str] = None


@app.get("/")
def root():
    return {
        "app": "MIRAGE AI Companion Backend",
        "status": "online",
        "docs_url": "/docs",
    }


tts = TextToSpeech()


@app.get("/health")
def healthcheck():
    return {
        "status": "ok",
        "device": DEVICE,
        "cnn_model": CNN_MODEL_NAME,
        "gemini_model": GEMINI_MODEL,
        "whisper_model": WHISPER_MODEL,
        "image_provider": IMAGE_PROVIDER,
        "tts_provider": TTS_PROVIDER,
        "stt_provider": STT_PROVIDER,
        "memory_items": len(memory),
    }


class TTSRequest(BaseModel):
    text: str


@app.post("/api/tts")
def synthesize_speech(req: TTSRequest):
    if TTS_PROVIDER == "macos_say":
        tts.speak_macos(req.text)
        return {"status": "ok", "mode": "macos_say"}
    elif TTS_PROVIDER == "elevenlabs":
        audio_data = tts.synthesize_elevenlabs(req.text)
        if audio_data:
            import base64
            b64_audio = base64.b64encode(audio_data).decode("utf-8")
            return {"status": "ok", "mode": "elevenlabs", "audio_base64": b64_audio}
    # Fallback par défaut vers le Web Speech API du navigateur
    return {"status": "ok", "mode": "browser_speech"}


@app.get("/api/memory")
def get_memory():
    return {
        "count": len(memory),
        "items": memory.get_recent(),
    }


@app.post("/api/chat")
def chat(req: ChatRequest):
    memory.record_transcript(req.text)
    memory_context = memory.format_for_gemini()

    answer_text = agent.generate_response(
        user_message=req.text,
        detected_label=req.detected_label,
        confidence=req.confidence,
        memory_context=memory_context,
    )
    memory.record_answer(answer_text)

    return {
        "answer": answer_text,
        "timestamp": int(time.time() * 1000),
    }


@app.post("/api/predict")
async def predict_frame(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    predictor = get_predictor()
    if predictor:
        result = predictor.predict(image)
        memory.record_detection(result["label"], result["confidence"])
        return result
    else:
        # Fallback si modèle non encore entraîné
        return {
            "label": "inconnu",
            "confidence": 0.0,
            "notes": "Modèle CNN en cours d'initialisation",
        }


@app.get("/api/arabic-sign/health")
def arabic_sign_health():
    return {
        "available": ARSL_MODEL_PATH.is_file() and ARSL_HAND_LANDMARKER_PATH.is_file(),
        "model": "ArSL CNN (32 static Arabic alphabet/sign classes)",
        "weights_path": str(ARSL_MODEL_PATH),
    }


@app.post("/api/arabic-sign/predict")
async def predict_arabic_sign(file: UploadFile = File(...)):
    """Predict one real ArSL static sign from an uploaded camera frame."""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
        result = get_arsl_predictor().predict(image)
    except Exception as error:
        return {"status": "error", "detail": str(error)}

    if result is None:
        return {"status": "no_hand"}
    return {"status": "ok", **result}


@app.post("/api/creative")
def generate_creative(req: CreativeRequest):
    result = creative.imagine_future(
        detected_label=req.detected_label,
        prompt=req.prompt,
    )
    return result


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client connecté")
    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            msg_type = data.get("type")

            if msg_type == "text":
                user_text = data.get("text", "")
                memory.record_transcript(user_text)

                answer = agent.generate_response(
                    user_message=user_text,
                    detected_label=data.get("detected_label"),
                    confidence=data.get("confidence"),
                    memory_context=memory.format_for_gemini(),
                )
                memory.record_answer(answer)

                await websocket.send_json({
                    "event": "answer",
                    "payload": {"text": answer},
                })

            elif msg_type == "ping":
                await websocket.send_json({"event": "pong"})

    except WebSocketDisconnect:
        print("[WebSocket] Client déconnecté")
    except Exception as e:
        print(f"[WebSocket] Erreur: {e}")
