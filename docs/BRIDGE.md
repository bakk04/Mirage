# MIRAGE bridge contract

The UI depends only on `MirageBridge` from `src/lib/mirageBridge.ts`. The default adapter is `MockBridge`; choose the adapter with `NEXT_PUBLIC_MIRAGE_BRIDGE=mock|ws`. `WebSocketBridge` is intentionally a no-op TODO until the future FastAPI transport is defined.

| Event | Payload |
| --- | --- |
| `detection` | `{ label, confidence, box: { x, y, w, h } }`, all box coordinates normalized to 0–1 |
| `transcript` | `{ text }` |
| `answer` | `{ text }` |
| `memory` | `{ id, blobUrl?, timestamp, label }` |
| `image` | `{ blobUrl, timestamp }` |

`sendFrame` and `sendAudio` are optional future transport methods. The current UI never fetches a server and never sends media outside the adapter boundary.
