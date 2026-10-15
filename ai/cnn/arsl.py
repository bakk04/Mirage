"""Real Arabic Sign Language (ArSL) static-sign CNN inference.

The model is an externally trained Keras CNN from pavlyhalim/Arabic-Sign-Language.
It recognizes the 32 static ArASL alphabet/sign labels below; it is not a
translator for continuous sign language or Arabic sentences.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

import threading
import time
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

ARSL_METADATA: list[dict[str, str]] = [
    {"id": "ain", "letter": "ع", "spoken_ar": "عَيْن", "name_en": "Ain"},
    {"id": "al", "letter": "ال", "spoken_ar": "ال", "name_en": "Al"},
    {"id": "aleff", "letter": "أ", "spoken_ar": "أَلِف", "name_en": "Alef"},
    {"id": "bb", "letter": "ب", "spoken_ar": "بَاء", "name_en": "Baa"},
    {"id": "dal", "letter": "د", "spoken_ar": "دَال", "name_en": "Dal"},
    {"id": "dha", "letter": "ظ", "spoken_ar": "ظَاء", "name_en": "Dhaa"},
    {"id": "dhad", "letter": "ض", "spoken_ar": "ضَاد", "name_en": "Dhad"},
    {"id": "fa", "letter": "ف", "spoken_ar": "فَاء", "name_en": "Faa"},
    {"id": "gaaf", "letter": "ق", "spoken_ar": "قَاف", "name_en": "Qaaf"},
    {"id": "ghain", "letter": "غ", "spoken_ar": "غَيْن", "name_en": "Ghain"},
    {"id": "ha", "letter": "ه", "spoken_ar": "هَاء", "name_en": "Haa"},
    {"id": "haa", "letter": "ح", "spoken_ar": "حَاء", "name_en": "Haa"},
    {"id": "jeem", "letter": "ج", "spoken_ar": "جِيم", "name_en": "Jeem"},
    {"id": "kaaf", "letter": "ك", "spoken_ar": "كَاف", "name_en": "Kaaf"},
    {"id": "khaa", "letter": "خ", "spoken_ar": "خَاء", "name_en": "Khaa"},
    {"id": "la", "letter": "لا", "spoken_ar": "لَا", "name_en": "Laa"},
    {"id": "laam", "letter": "ل", "spoken_ar": "لَام", "name_en": "Laam"},
    {"id": "meem", "letter": "م", "spoken_ar": "مِيم", "name_en": "Meem"},
    {"id": "nun", "letter": "ن", "spoken_ar": "نُون", "name_en": "Noon"},
    {"id": "ra", "letter": "ر", "spoken_ar": "رَاء", "name_en": "Raa"},
    {"id": "saad", "letter": "ص", "spoken_ar": "صَاد", "name_en": "Saad"},
    {"id": "seen", "letter": "س", "spoken_ar": "سِين", "name_en": "Seen"},
    {"id": "sheen", "letter": "ش", "spoken_ar": "شِين", "name_en": "Sheen"},
    {"id": "ta", "letter": "ت", "spoken_ar": "تَاء", "name_en": "Taa"},
    {"id": "taa", "letter": "ط", "spoken_ar": "طَاء", "name_en": "Taa"},
    {"id": "thaa", "letter": "ث", "spoken_ar": "ثَاء", "name_en": "Thaa"},
    {"id": "thal", "letter": "ذ", "spoken_ar": "ذَال", "name_en": "Thal"},
    {"id": "toot", "letter": "ة", "spoken_ar": "تَاء مَرْبُوطَة", "name_en": "Taa Marbouta"},
    {"id": "waw", "letter": "و", "spoken_ar": "وَاو", "name_en": "Waaw"},
    {"id": "ya", "letter": "ى", "spoken_ar": "أَلِف مَقْصُورَة", "name_en": "Alef Maqsura"},
    {"id": "yaa", "letter": "ي", "spoken_ar": "يَاء", "name_en": "Yaa"},
    {"id": "zay", "letter": "ز", "spoken_ar": "زَاي", "name_en": "Zaay"},
]

ARSL_CLASSES = [(item["id"], item["letter"]) for item in ARSL_METADATA]


class ArabicSignPredictor:
    def __init__(self, model_path: Path, hand_landmarker_path: Path):
        if not model_path.is_file():
            raise FileNotFoundError(f"ArSL CNN weights are missing: {model_path}")
        if not hand_landmarker_path.is_file():
            raise FileNotFoundError(f"ArSL hand landmarker is missing: {hand_landmarker_path}")

        import mediapipe as mp
        from keras import Sequential, layers
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        self._lock = threading.Lock()
        self._mp = mp

        # Build clean Keras 3 sequential model and load trained weights
        model = Sequential([
            layers.Input(shape=(64, 64, 3)),
            layers.Conv2D(32, (3, 3), activation="relu", name="conv2d_6"),
            layers.MaxPooling2D((2, 2), name="max_pooling2d_4"),
            layers.Conv2D(64, (3, 3), activation="relu", name="conv2d_7"),
            layers.MaxPooling2D((2, 2), name="max_pooling2d_5"),
            layers.Conv2D(64, (3, 3), activation="relu", name="conv2d_8"),
            layers.Flatten(name="flatten_2"),
            layers.Dense(64, activation="relu", name="dense_4"),
            layers.Dense(32, activation="softmax", name="dense_5"),
        ])
        model.load_weights(str(model_path))
        self._model = model

        options = vision.HandLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=str(hand_landmarker_path)),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._landmarker = vision.HandLandmarker.create_from_options(options)

    def predict(self, image: Image.Image | np.ndarray) -> dict[str, Any] | None:
        start_time = time.perf_counter()
        if isinstance(image, np.ndarray):
            rgb = image if image.ndim == 3 and image.shape[2] == 3 else np.asarray(Image.fromarray(image).convert("RGB"))
        else:
            rgb = np.asarray(image.convert("RGB"))

        with self._lock:
            mp_image = self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=rgb)
            result = self._landmarker.detect(mp_image)
            if not result.hand_landmarks:
                return None

            landmarks = result.hand_landmarks[0]
            height, width = rgb.shape[:2]
            xs = [point.x * width for point in landmarks]
            ys = [point.y * height for point in landmarks]
            x_min, x_max = min(xs), max(xs)
            y_min, y_max = min(ys), max(ys)
            centre_x, centre_y = (x_min + x_max) / 2, (y_min + y_max) / 2
            half = max(x_max - x_min, y_max - y_min) / 2 * 1.35
            left, top = max(0, int(centre_x - half)), max(0, int(centre_y - half))
            right, bottom = min(width, int(centre_x + half)), min(height, int(centre_y + half))
            if right - left < 20 or bottom - top < 20:
                return None

            crop = Image.fromarray(rgb[top:bottom, left:right]).resize((64, 64))
            tensor = np.asarray(crop, dtype=np.float32)[None, ...] / 255.0
            probabilities = self._model.predict(tensor, verbose=0)[0]

        index = int(np.argmax(probabilities))
        meta = ARSL_METADATA[index]
        inference_ms = (time.perf_counter() - start_time) * 1000

        return {
            "sign_id": meta["id"],
            "arabic_label": meta["letter"],
            "gloss_arabic": meta["id"],
            "spoken_arabic": meta["spoken_ar"],
            "name_en": meta["name_en"],
            "confidence": float(probabilities[index]),
            "class_index": index,
            "inference_ms": round(inference_ms, 2),
            "top_probabilities": {
                ARSL_METADATA[i]["letter"]: round(float(probabilities[i]), 4)
                for i in np.argsort(probabilities)[-3:][::-1]
            },
        }

    def close(self) -> None:
        with self._lock:
            if hasattr(self, "_landmarker"):
                self._landmarker.close()
