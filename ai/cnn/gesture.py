"""MediaPipe Gesture Recognizer & Browser Control Predictor.

Uses the official MediaPipe Gesture Recognizer task bundle
(models/gesture_command_mediapipe/gesture_recognizer.task) paired with
geometric landmark analysis and temporal tracking for browser control:
- Gesture 5: Close current browser tab / exit (close_tab)
- Gesture 2 — Up: Scroll page upward (scroll_up)
- Gesture 2 — Down: Scroll page downward (scroll_down)
- Gesture 3: Refresh page (refresh_page)
"""

from __future__ import annotations

import math
import threading
import time
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image


class GesturePredictor:
    def __init__(self, model_path: Path):
        if not model_path.is_file():
            raise FileNotFoundError(f"Gesture recognizer task missing: {model_path}")

        import mediapipe as mp
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        self._lock = threading.Lock()
        self._mp = mp

        options = vision.GestureRecognizerOptions(
            base_options=python.BaseOptions(model_asset_path=str(model_path)),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.6,
            min_hand_presence_confidence=0.6,
            min_tracking_confidence=0.6,
        )
        self._recognizer = vision.GestureRecognizer.create_from_options(options)

        # Temporal tracking state
        self._prev_landmarks: list[dict[str, float]] | None = None
        self._prev_timestamp = 0.0
        self._last_command_time: dict[str, float] = {}

    def predict(self, image: Image.Image | np.ndarray) -> dict[str, Any] | None:
        start_time = time.perf_counter()
        now_sec = time.time()

        if isinstance(image, np.ndarray):
            rgb = image if image.ndim == 3 and image.shape[2] == 3 else np.asarray(Image.fromarray(image).convert("RGB"))
        else:
            rgb = np.asarray(image.convert("RGB"))

        with self._lock:
            mp_image = self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=rgb)
            result = self._recognizer.recognize(mp_image)

        if not result.hand_landmarks:
            self._prev_landmarks = None
            return None

        landmarks_raw = result.hand_landmarks[0]
        landmarks: list[dict[str, float]] = [
            {"x": float(pt.x), "y": float(pt.y), "z": float(pt.z)}
            for pt in landmarks_raw
        ]

        # Built-in category from MediaPipe
        builtin_gesture = "None"
        builtin_confidence = 0.0
        if result.gestures and len(result.gestures[0]) > 0:
            top_cat = result.gestures[0][0]
            builtin_gesture = top_cat.category_name
            builtin_confidence = float(top_cat.score)

        # Geometric & Temporal Analysis for Browser Gestures
        analysis = self._analyze_landmarks(landmarks, now_sec)

        effective_gesture = analysis["gesture"] or (
            builtin_gesture if builtin_gesture not in ("None", "Unrecognized") else None
        )
        confidence = max(builtin_confidence, analysis["confidence"])

        inference_ms = (time.perf_counter() - start_time) * 1000

        return {
            "gesture_name": effective_gesture,
            "builtin_gesture": builtin_gesture,
            "confidence": round(confidence, 3),
            "command": analysis["command"],
            "command_label": analysis["command_label"],
            "landmarks": landmarks,
            "motion_dy": round(analysis["motion_dy"], 4),
            "inference_ms": round(inference_ms, 2),
        }

    def _analyze_landmarks(
        self,
        lm: list[dict[str, float]],
        now_sec: float,
    ) -> dict[str, Any]:
        if len(lm) < 21:
            return {
                "gesture": None,
                "command": None,
                "command_label": None,
                "confidence": 0.0,
                "motion_dy": 0.0,
            }

        def dist(p1: dict[str, float], p2: dict[str, float]) -> float:
            return math.hypot(p1["x"] - p2["x"], p1["y"] - p2["y"])

        wrist = lm[0]
        thumb_tip, thumb_mcp = lm[4], lm[2]
        index_tip, index_pip, index_mcp = lm[8], lm[6], lm[5]
        middle_tip, middle_pip, middle_mcp = lm[12], lm[10], lm[9]
        ring_tip, ring_pip, ring_mcp = lm[16], lm[14], lm[13]
        pinky_tip, pinky_pip, pinky_mcp = lm[20], lm[18], lm[17]

        # Finger extensions (using MCP-to-tip vs MCP-to-pip for rotation-invariant extension detection)
        is_index_ext = dist(index_mcp, index_tip) > dist(index_mcp, index_pip) * 1.2
        is_middle_ext = dist(middle_mcp, middle_tip) > dist(middle_mcp, middle_pip) * 1.2
        is_ring_ext = dist(ring_mcp, ring_tip) > dist(ring_mcp, ring_pip) * 1.2
        is_ring_curled = dist(ring_mcp, ring_tip) < dist(ring_mcp, ring_pip) * 1.15
        is_pinky_ext = dist(pinky_mcp, pinky_tip) > dist(pinky_mcp, pinky_pip) * 1.2
        is_pinky_curled = dist(pinky_mcp, pinky_tip) < dist(pinky_mcp, pinky_pip) * 1.15
        is_thumb_ext = dist(wrist, thumb_tip) > dist(wrist, thumb_mcp) * 1.15 or dist(thumb_mcp, thumb_tip) > dist(thumb_mcp, lm[3]) * 1.15

        # Motion tracking (dy velocity)
        motion_dy = 0.0
        if self._prev_landmarks and self._prev_timestamp > 0:
            dt = max(0.01, now_sec - self._prev_timestamp)
            motion_dy = (wrist["y"] - self._prev_landmarks[0]["y"]) / dt
        self._prev_landmarks = lm
        self._prev_timestamp = now_sec

        gesture: str | None = None
        command: str | None = None
        command_label: str | None = None
        confidence = 0.0

        # GESTURE 5: All 5 fingers extended / Open Palm -> Close Tab
        if is_thumb_ext and is_index_ext and is_middle_ext and is_ring_ext and is_pinky_ext:
            gesture = "Five_Fingers"
            command = "close_tab"
            command_label = "Gesture 5: Close Current Tab"
            confidence = 0.90

        # GESTURE 3: Three fingers extended (index, middle, ring), pinky curled -> Refresh
        elif is_index_ext and is_middle_ext and is_ring_ext and is_pinky_curled:
            gesture = "Three_Fingers"
            command = "refresh_page"
            command_label = "Gesture 3: Refresh Current Page"
            confidence = 0.88

        # GESTURE 2: Index & Middle extended, Ring & Pinky curled
        elif is_index_ext and is_middle_ext and is_ring_curled and is_pinky_curled:
            # Check orientation: y is 0 at top, 1 at bottom
            index_dy = index_tip["y"] - index_mcp["y"]
            middle_dy = middle_tip["y"] - middle_mcp["y"]

            if index_dy < -0.05 and middle_dy < -0.05:
                # Pointing Up
                gesture = "Two_Fingers_Up"
                command = "scroll_up"
                command_label = "Gesture 2 — Up: Scroll Upward"
                confidence = 0.89
            elif index_dy > 0.05 and middle_dy > 0.05:
                # Pointing Down
                gesture = "Two_Fingers_Down"
                command = "scroll_down"
                command_label = "Gesture 2 — Down: Scroll Downward"
                confidence = 0.89
            elif motion_dy < -0.15:
                # Moving Up
                gesture = "Two_Fingers_Up"
                command = "scroll_up"
                command_label = "Gesture 2 — Up: Scroll Upward"
                confidence = 0.85
            elif motion_dy > 0.15:
                # Moving Down
                gesture = "Two_Fingers_Down"
                command = "scroll_down"
                command_label = "Gesture 2 — Down: Scroll Downward"
                confidence = 0.85

        return {
            "gesture": gesture,
            "command": command,
            "command_label": command_label,
            "confidence": confidence,
            "motion_dy": motion_dy,
        }

    def close(self) -> None:
        with self._lock:
            if hasattr(self, "_recognizer"):
                self._recognizer.close()
