"""FastAPI application for MIRAGE AI Companion.

Exposes REST and WebSocket endpoints for real-time Arabic Sign Language (ArSL)
translation, MediaPipe gesture commands & browser control, voice synthesis,
short-term memory, and cognitive reasoning.
"""

from __future__ import annotations

import asyncio
import base64
import io
import json
import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager
from typing import Any, Optional

import cv2
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
    GESTURE_MODEL_PATH,
)
from ai.memory.short_term import ShortTermMemory
from ai.agent.reasoning import MirageAgent
from ai.agent.creative import CreativeModule
from ai.voice.tts import TextToSpeech
from ai.cnn.arsl import ArabicSignPredictor, ARSL_METADATA
from ai.cnn.gesture import GesturePredictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("mirage.backend")

# Global shared state
memory = ShortTermMemory(maxlen=30)
agent = MirageAgent()
creative = CreativeModule()
tts = TextToSpeech()

# Preloaded predictor singletons
arsl_predictor: ArabicSignPredictor | None = None
gesture_predictor: GesturePredictor | None = None
model_load_status: dict[str, Any] = {
    "arsl": {"loaded": False, "load_time_ms": 0.0, "error": None},
    "gesture": {"loaded": False, "load_time_ms": 0.0, "error": None},
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global arsl_predictor, gesture_predictor
    logger.info("Initializing MIRAGE AI Backend and pre-loading models...")

    # Load Arabic Sign Language model
    t0 = time.perf_counter()
    try:
        if ARSL_MODEL_PATH.is_file() and ARSL_HAND_LANDMARKER_PATH.is_file():
            arsl_predictor = ArabicSignPredictor(ARSL_MODEL_PATH, ARSL_HAND_LANDMARKER_PATH)
            load_ms = (time.perf_counter() - t0) * 1000
            model_load_status["arsl"] = {
                "loaded": True,
                "load_time_ms": round(load_ms, 2),
                "model_path": str(ARSL_MODEL_PATH),
                "classes_count": len(ARSL_METADATA),
            }
            logger.info("ArabicSignPredictor initialized in %.1f ms (%d classes)", load_ms, len(ARSL_METADATA))
        else:
            logger.warning("ArSL model files not found: %s", ARSL_MODEL_PATH)
            model_load_status["arsl"]["error"] = "Model files missing"
    except Exception as exc:
        logger.error("Failed to load ArabicSignPredictor: %s", exc, exc_info=True)
        model_load_status["arsl"]["error"] = str(exc)

    # Load Gesture Recognizer model
    t1 = time.perf_counter()
    try:
        if GESTURE_MODEL_PATH.is_file():
            gesture_predictor = GesturePredictor(GESTURE_MODEL_PATH)
            load_ms = (time.perf_counter() - t1) * 1000
            model_load_status["gesture"] = {
                "loaded": True,
                "load_time_ms": round(load_ms, 2),
                "model_path": str(GESTURE_MODEL_PATH),
            }
            logger.info("GesturePredictor initialized in %.1f ms", load_ms)
        else:
            logger.warning("Gesture model file not found: %s", GESTURE_MODEL_PATH)
            model_load_status["gesture"]["error"] = "Gesture task file missing"
    except Exception as exc:
        logger.error("Failed to load GesturePredictor: %s", exc, exc_info=True)
        model_load_status["gesture"]["error"] = str(exc)

    yield

    logger.info("Shutting down MIRAGE AI Backend and releasing model handles...")
    if arsl_predictor:
        arsl_predictor.close()
    if gesture_predictor:
        gesture_predictor.close()


app = FastAPI(
    title="MIRAGE AI Companion API",
    version="2.4.0",
    description="Multimodal companion backend powered by ArSL CNN, MediaPipe, Whisper, and Gemini.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    text: str
    detected_label: Optional[str] = None
    confidence: Optional[float] = None


class CreativeRequest(BaseModel):
    prompt: Optional[str] = None
    detected_label: Optional[str] = None


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "ar"


class ReconstructSignRequest(BaseModel):
    letters: list[str] | str
    context: Optional[str] = None
    speak: Optional[bool] = False
    language: Optional[str] = "ar"


@app.get("/")
def root():
    return {
        "app": "MIRAGE AI Companion Backend",
        "version": "2.4.0",
        "status": "online",
        "models": {
            "arsl_loaded": model_load_status["arsl"]["loaded"],
            "gesture_loaded": model_load_status["gesture"]["loaded"],
        },
        "docs_url": "/docs",
    }


@app.get("/health")
def healthcheck():
    return {
        "status": "ok",
        "device": DEVICE,
        "models": model_load_status,
        "gemini_model": GEMINI_MODEL,
        "whisper_model": WHISPER_MODEL,
        "tts_provider": TTS_PROVIDER,
        "stt_provider": STT_PROVIDER,
        "memory_items": len(memory),
    }


@app.get("/api/diagnostics")
def system_diagnostics():
    return {
        "status": "healthy",
        "server_time": time.time(),
        "device": DEVICE,
        "models": {
            "arabic_sign": {
                "available": model_load_status["arsl"]["loaded"],
                "architecture": "MobileNetV2 / ArSL Custom CNN",
                "weights_path": str(ARSL_MODEL_PATH),
                "hand_landmarker_path": str(ARSL_HAND_LANDMARKER_PATH),
                "classes": len(ARSL_METADATA),
                "sample_classes": [m["letter"] for m in ARSL_METADATA[:5]],
                "load_time_ms": model_load_status["arsl"]["load_time_ms"],
            },
            "gesture_command": {
                "available": model_load_status["gesture"]["loaded"],
                "framework": "MediaPipe Gesture Recognizer float16",
                "model_path": str(GESTURE_MODEL_PATH),
                "supported_commands": [
                    {"code": "close_tab", "gesture": "Gesture 5 (Five Fingers / Palm)", "action": "Close browser tab"},
                    {"code": "scroll_up", "gesture": "Gesture 2 — Up", "action": "Scroll page upward"},
                    {"code": "scroll_down", "gesture": "Gesture 2 — Down", "action": "Scroll page downward"},
                    {"code": "refresh_page", "gesture": "Gesture 3 (Three Fingers)", "action": "Refresh page"},
                ],
                "load_time_ms": model_load_status["gesture"]["load_time_ms"],
            },
        },
        "pipeline_capabilities": {
            "realtime_websocket": True,
            "temporal_smoothing": True,
            "anti_repetition_lock": True,
            "browser_control": True,
            "fast_arabic_tts": True,
        },
    }


@app.get("/api/arabic-sign/health")
def arabic_sign_health():
    return {
        "available": model_load_status["arsl"]["loaded"],
        "model": "ArSL CNN (32 static Arabic alphabet classes)",
        "weights_path": str(ARSL_MODEL_PATH),
        "classes_count": len(ARSL_METADATA),
        "input_shape": [1, 64, 64, 3],
        "normalization": "1.0 / 255.0 RGB",
    }


@app.post("/api/arabic-sign/predict")
async def predict_arabic_sign(file: UploadFile = File(...)):
    """Predict one static ArSL sign from an uploaded frame image."""
    if not arsl_predictor:
        return {"status": "error", "detail": "Arabic sign predictor not loaded"}

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        # Run CPU inference off the main asyncio thread
        result = await asyncio.to_thread(arsl_predictor.predict, image)
    except Exception as error:
        logger.error("ArSL prediction error: %s", error)
        return {"status": "error", "detail": str(error)}

    if result is None:
        return {"status": "no_hand"}
    return {"status": "ok", **result}


@app.post("/api/arabic-sign/reconstruct")
async def reconstruct_arabic_sign_sentence(req: ReconstructSignRequest):
    """Reconstruct a sequence of fingerspelled Arabic letters into full words & sentences via Gemini AI."""
    result = await asyncio.to_thread(agent.reconstruct_arabic_sentence, req.letters, req.context)
    if req.speak and result.get("sentence"):
        if TTS_PROVIDER == "macos_say":
            tts.speak_macos(result["sentence"])
    return result


@app.post("/api/arabic-sign/analyze-video")
async def analyze_arabic_sign_video(file: UploadFile = File(...)):
    """Analyze an uploaded video file containing Arabic sign language sentences using Gemini Vision & CNN."""
    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        frames: list[Image.Image] = []
        cnn_detected_letters: list[str] = []
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        duration_sec = total_frames / max(fps, 1.0)

        # Sample up to 16 keyframes across the video
        step = max(1, total_frames // 16) if total_frames > 0 else 1
        sample_indices = set(range(0, total_frames, step))

        idx = 0
        while cap.isOpened() and len(frames) < 16:
            ret, frame = cap.read()
            if not ret:
                break
            if idx in sample_indices or total_frames <= 16:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb)
                frames.append(pil_img)
                if arsl_predictor:
                    pred = arsl_predictor.predict(pil_img)
                    if pred and pred.get("arabic_label"):
                        cnn_detected_letters.append(pred["arabic_label"])
            idx += 1
        cap.release()

        # Translate with Gemini Multimodal Vision
        hint = f"Durée: {duration_sec:.1f}s. Lettres statiques repérées par CNN: {' '.join(cnn_detected_letters)}" if cnn_detected_letters else None
        gemini_res = await asyncio.to_thread(agent.translate_sign_frames, frames, hint)

        sentence = gemini_res.get("sentence", "") if gemini_res.get("status") == "ok" else ""
        if not sentence and cnn_detected_letters:
            reconstruct_res = await asyncio.to_thread(agent.reconstruct_arabic_sentence, cnn_detected_letters)
            sentence = reconstruct_res.get("sentence", "")

        return {
            "status": "ok",
            "sentence": sentence,
            "detected_letters": cnn_detected_letters,
            "duration_sec": round(duration_sec, 2),
            "sampled_frames_count": len(frames),
            "method": "gemini_multimodal" if gemini_res.get("status") == "ok" else "cnn_reconstruction",
        }
    except Exception as e:
        logger.error("Error analyzing sign video: %s", e)
        return {"status": "error", "detail": str(e)}
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.get("/api/gesture/health")
def gesture_health():
    return {
        "available": model_load_status["gesture"]["loaded"],
        "model": "MediaPipe Gesture Recognizer & Browser Controller",
        "model_path": str(GESTURE_MODEL_PATH),
        "commands": ["close_tab", "scroll_up", "scroll_down", "refresh_page"],
    }


@app.post("/api/gesture/predict")
async def predict_gesture(file: UploadFile = File(...)):
    """Predict hand gesture and browser command from an uploaded frame image."""
    if not gesture_predictor:
        return {"status": "error", "detail": "Gesture predictor not loaded"}

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = await asyncio.to_thread(gesture_predictor.predict, image)
    except Exception as error:
        logger.error("Gesture prediction error: %s", error)
        return {"status": "error", "detail": str(error)}

    if result is None:
        return {"status": "no_hand"}
    return {"status": "ok", **result}


@app.post("/api/tts")
def synthesize_speech(req: TTSRequest):
    """Text-to-speech endpoint with Arabic support."""
    if TTS_PROVIDER == "macos_say":
        tts.speak_macos(req.text)
        return {"status": "ok", "mode": "macos_say"}
    elif TTS_PROVIDER == "elevenlabs":
        audio_data = tts.synthesize_elevenlabs(req.text)
        if audio_data:
            b64_audio = base64.b64encode(audio_data).decode("utf-8")
            return {"status": "ok", "mode": "elevenlabs", "audio_base64": b64_audio}
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


@app.post("/api/creative")
def generate_creative(req: CreativeRequest):
    return creative.imagine_future(
        detected_label=req.detected_label,
        prompt=req.prompt,
    )


def decode_image_bytes(raw_data: str) -> Image.Image:
    """Helper to decode base64 data URL or raw base64 string to PIL Image."""
    if "," in raw_data:
        raw_data = raw_data.split(",", 1)[1]
    image_bytes = base64.b64decode(raw_data)
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """High-performance real-time WebSocket connection for bidirectional vision,

    sign translation, browser gesture commands, and companion communication.
    """
    await websocket.accept()
    client_host = websocket.client.host if websocket.client else "unknown"
    logger.info("[WebSocket] Client connected from %s", client_host)

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                await websocket.send_json({"event": "error", "detail": "Invalid JSON format"})
                continue

            msg_type = data.get("type")

            # 1. PING - Heartbeat
            if msg_type == "ping":
                await websocket.send_json({"event": "pong", "timestamp": int(time.time() * 1000)})
                continue

            # 2. VISION FRAME - Real-Time Webcam Inference
            elif msg_type in ("vision_frame", "frame"):
                image_data = data.get("image") or data.get("data")
                if not image_data:
                    continue

                mode = data.get("mode", "sign_language")
                frame_seq = data.get("seq", 0)
                t_start = time.perf_counter()

                try:
                    img = await asyncio.to_thread(decode_image_bytes, image_data)
                except Exception as decode_err:
                    logger.debug("Frame decode error: %s", decode_err)
                    continue

                # Execute requested mode(s) without blocking asyncio loop
                if mode in ("sign_language", "all", "dual") and arsl_predictor:
                    arsl_result = await asyncio.to_thread(arsl_predictor.predict, img)
                    if arsl_result is None:
                        await websocket.send_json({
                            "event": "arabic_sign",
                            "seq": frame_seq,
                            "data": {"status": "no_hand", "timestamp": int(time.time() * 1000)},
                        })
                    else:
                        await websocket.send_json({
                            "event": "arabic_sign",
                            "seq": frame_seq,
                            "data": {"status": "ok", **arsl_result, "timestamp": int(time.time() * 1000)},
                        })

                if mode in ("browser_control", "all", "dual") and gesture_predictor:
                    gesture_result = await asyncio.to_thread(gesture_predictor.predict, img)
                    if gesture_result is not None:
                        await websocket.send_json({
                            "event": "gesture_command",
                            "seq": frame_seq,
                            "data": {"status": "ok", **gesture_result, "timestamp": int(time.time() * 1000)},
                        })

                total_ms = (time.perf_counter() - t_start) * 1000
                await websocket.send_json({
                    "event": "telemetry",
                    "seq": frame_seq,
                    "data": {
                        "total_latency_ms": round(total_ms, 2),
                        "fps": round(1000.0 / max(total_ms, 1.0), 1),
                        "device": DEVICE,
                    },
                })

            # 3. TEXT CHAT - Multimodal Reasoning
            elif msg_type == "text":
                user_text = data.get("text", "")
                memory.record_transcript(user_text)

                answer = await asyncio.to_thread(
                    agent.generate_response,
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

            # 4. ARSL SENTENCE RECONSTRUCTION - Gemini AI
            elif msg_type in ("reconstruct_sign", "reconstruct_sign_sentence"):
                raw_letters = data.get("letters", [])
                context = data.get("context")
                reconstructed = await asyncio.to_thread(agent.reconstruct_arabic_sentence, raw_letters, context)
                await websocket.send_json({
                    "event": "arabic_sentence_reconstructed",
                    "data": reconstructed,
                })

    except WebSocketDisconnect:
        logger.info("[WebSocket] Client disconnected (%s)", client_host)
    except Exception as exc:
        logger.error("[WebSocket] Exception: %s", exc, exc_info=True)
