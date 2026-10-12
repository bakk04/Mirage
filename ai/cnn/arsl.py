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

ARSL_CLASSES = [
    ("ain", "ع"), ("al", "ال"), ("aleff", "أ"), ("bb", "ب"),
    ("dal", "د"), ("dha", "ط"), ("dhad", "ض"), ("fa", "ف"),
    ("gaaf", "ج"), ("ghain", "غ"), ("ha", "ه"), ("haa", "ه"),
    ("jeem", "ج"), ("kaaf", "ك"), ("khaa", "خ"), ("la", "لا"),
    ("laam", "ل"), ("meem", "م"), ("nun", "ن"), ("ra", "ر"),
    ("saad", "ص"), ("seen", "س"), ("sheen", "ش"), ("ta", "ت"),
    ("taa", "ط"), ("thaa", "ث"), ("thal", "ذ"), ("toot", "ت"),
    ("waw", "و"), ("ya", "ى"), ("yaa", "ي"), ("zay", "ز"),
]


class ArabicSignPredictor:
    def __init__(self, model_path: Path, hand_landmarker_path: Path):
        if not model_path.is_file():
            raise FileNotFoundError(f"ArSL CNN weights are missing: {model_path}")
        if not hand_landmarker_path.is_file():
            raise FileNotFoundError(f"ArSL hand landmarker is missing: {hand_landmarker_path}")

        import mediapipe as mp
        import tensorflow as tf
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        self._mp = mp
        self._model = tf.keras.models.load_model(model_path, compile=False)
        options = vision.HandLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=str(hand_landmarker_path)),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._landmarker = vision.HandLandmarker.create_from_options(options)

    def predict(self, image: Image.Image) -> dict[str, Any] | None:
        rgb = np.asarray(image.convert("RGB"))
        result = self._landmarker.detect(
            self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=rgb),
        )
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
        identifier, arabic_label = ARSL_CLASSES[index]
        return {
            "sign_id": identifier,
            "arabic_label": arabic_label,
            "gloss_arabic": identifier,
            "confidence": float(probabilities[index]),
            "class_index": index,
        }

    def close(self) -> None:
        self._landmarker.close()
