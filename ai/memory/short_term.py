"""Short-term memory module for MIRAGE AI Companion.

Maintains a bounded deque (default 30 events) storing vision detections,
user transcripts, and assistant answers with timestamps.
"""

from collections import deque
from datetime import datetime
from typing import Any, Dict, List, Optional


class ShortTermMemory:
    """Mémoire vive tampon circulaire des N derniers événements."""

    def __init__(self, maxlen: int = 30):
        self._memory: deque[Dict[str, Any]] = deque(maxlen=maxlen)

    def record_event(self, event_type: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Enregistre un événement avec timestamp ISO."""
        entry = {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "iso_time": datetime.now().isoformat(),
            "type": event_type,
            "details": details,
        }
        self._memory.append(entry)
        return entry

    def record_detection(self, label: str, confidence: float, box: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """Enregistre une détection visuelle (CNN)."""
        return self.record_event(
            "detection",
            {
                "label": label,
                "confidence": round(confidence, 4),
                "box": box or {},
            },
        )

    def record_transcript(self, text: str) -> Dict[str, Any]:
        """Enregistre une transcription vocale de l'utilisateur."""
        return self.record_event("transcript", {"text": text})

    def record_answer(self, text: str) -> Dict[str, Any]:
        """Enregistre une réponse de l'assistant."""
        return self.record_event("answer", {"text": text})

    def get_recent(self, count: Optional[int] = None) -> List[Dict[str, Any]]:
        """Retourne les N derniers événements (ou tous si count est None)."""
        items = list(self._memory)
        if count is not None:
            return items[-count:]
        return items

    def format_for_gemini(self) -> str:
        """Formate l'historique récent sous forme de texte concis pour le contexte du prompt Gemini."""
        if not self._memory:
            return "Aucun événement mémorisé pour le moment."

        lines = []
        for item in self._memory:
            t = item["timestamp"]
            kind = item["type"]
            d = item["details"]
            if kind == "detection":
                lines.append(f"[{t}] CNN a détecté : {d['label']} (confiance: {d['confidence']*100:.1f}%)")
            elif kind == "transcript":
                lines.append(f"[{t}] Utilisateur : \"{d['text']}\"")
            elif kind == "answer":
                lines.append(f"[{t}] Mirage AI : \"{d['text']}\"")
            else:
                lines.append(f"[{t}] {kind} : {d}")
        return "\n".join(lines)

    def clear(self) -> None:
        """Vide la mémoire."""
        self._memory.clear()

    def __len__(self) -> int:
        return len(self._memory)
