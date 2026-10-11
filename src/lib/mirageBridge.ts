export type DetectionBox = {
  x: number
  y: number
  w: number
  h: number
}

export type Detection = {
  label: string
  confidence: number
  box: DetectionBox
}

export type MirageEventPayloads = {
  detection: Detection
  transcript: TranscriptPayload
  answer: AnswerPayload
  memory: MemoryPayload
  image: ImagePayload
}

export type TranscriptPayload = { text: string }
export type AnswerPayload = { text: string }
export type MemoryPayload = {
  id: string
  blobUrl?: string
  timestamp: number
  label: string
}
export type ImagePayload = {
  blobUrl: string
  timestamp: number
}

export interface MirageBridge {
  connect(): void
  disconnect(): void
  sendFrame?(blob: Blob): void
  sendAudio?(chunk: Blob): void
  sendText(text: string): void
  on<K extends keyof MirageEventPayloads>(
    event: K,
    cb: (payload: MirageEventPayloads[K]) => void,
  ): () => void
}

export class MockBridge implements MirageBridge {
  private listeners = new Map<keyof MirageEventPayloads, Set<(
    payload: never,
  ) => void>>()

  connect() {}

  disconnect() {
    this.listeners.clear()
  }

  sendText(text: string) {
    const answer =
      text.toLowerCase().includes("hold") || text.toLowerCase().includes("see")
        ? "I can help you make sense of what is in front of you. Show me something and I will stay with the details."
        : "I’m here. Tell me what you want to notice, remember, or imagine."
    window.setTimeout(() => this.emit("answer", { text: answer }), 420)
  }

  emit<K extends keyof MirageEventPayloads,>(
    event: K,
    payload: MirageEventPayloads[K],
  ) {
    this.listeners.get(event)?.forEach((listener) => listener(payload as never))
  }

  on<K extends keyof MirageEventPayloads,>(
    event: K,
    cb: (payload: MirageEventPayloads[K]) => void,
  ) {
    const listeners = this.listeners.get(event) ?? new Set()
    listeners.add(cb as (payload: never) => void)
    this.listeners.set(event, listeners)
    return () => listeners.delete(cb as (payload: never) => void)
  }
}

/** TODO: connect this adapter to the future FastAPI/WebSocket transport. */
export class WebSocketBridge implements MirageBridge {
  connect() {}
  disconnect() {}
  sendText(_text: string) {}
  on<K extends keyof MirageEventPayloads,>(
    _event: K,
    _cb: (payload: MirageEventPayloads[K]) => void,
  ) {
    return () => {}
  }
}

export function createMirageBridge(): MirageBridge {
  const mode =
    typeof import.meta.env.NEXT_PUBLIC_MIRAGE_BRIDGE === "string"
      ? import.meta.env.NEXT_PUBLIC_MIRAGE_BRIDGE
      : "mock"
  return mode === "ws" ? new WebSocketBridge() : new MockBridge()
}
