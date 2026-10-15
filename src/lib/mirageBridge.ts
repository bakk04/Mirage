/**
 * MIRAGE AI - Real-Time Communication Bridge
 *
 * Connects the Next.js / Vite client directly to the FastAPI backend
 * via persistent WebSockets, supporting real-time webcam frame streaming,
 * ArSL sign translation, MediaPipe browser control commands, and telemetry.
 */

export type ArabicSignPayload = {
  status: "ok" | "no_hand" | "error"
  sign_id?: string
  arabic_label?: string
  gloss_arabic?: string
  spoken_arabic?: string
  name_en?: string
  confidence?: number
  class_index?: number
  inference_ms?: number
  top_probabilities?: Record<string, number>
  timestamp?: number
}

export type GestureCommandPayload = {
  status: "ok" | "no_hand" | "error"
  gesture_name?: string
  builtin_gesture?: string
  confidence?: number
  command?: string
  command_label?: string
  motion_dy?: number
  inference_ms?: number
  timestamp?: number
}

export type TelemetryPayload = {
  total_latency_ms: number
  fps: number
  device: string
}

export type AnswerPayload = { text: string }
export type ConnectionStatePayload = { state: "connected" | "disconnected" | "connecting" | "error"; detail?: string }

export type MirageBridgeEvents = {
  arabic_sign: ArabicSignPayload
  arabic_sentence_reconstructed: {
    status: string
    sentence: string
    original_letters?: string
    source?: string
    latency_ms?: number
    error?: string
  }
  gesture_command: GestureCommandPayload
  telemetry: TelemetryPayload
  answer: AnswerPayload
  connection: ConnectionStatePayload
  pong: { timestamp: number }
}

export interface MirageBridge {
  connect(): void
  disconnect(): void
  isConnected(): boolean
  sendVisionFrame(imageDataUrl: string, mode?: string, seq?: number): boolean
  sendText(text: string, detectedLabel?: string, confidence?: number): void
  sendReconstructSign(letters: string[], context?: string): boolean
  on<K extends keyof MirageBridgeEvents>(
    event: K,
    cb: (payload: MirageBridgeEvents[K]) => void,
  ): () => void
}

export class WebSocketBridge implements MirageBridge {
  private ws: WebSocket | null = null
  private reconnectTimer: any = null
  private pingInterval: any = null
  private retryCount = 0
  private shouldConnect = false
  private listeners = new Map<keyof MirageBridgeEvents, Set<(payload: any) => void>>()

  constructor(private url?: string) {}

  private resolveUrl(): string {
    if (this.url) return this.url
    if (typeof window === "undefined") return "ws://127.0.0.1:8000/ws"

    const isSecure = window.location.protocol === "https:"
    const protocol = isSecure ? "wss:" : "ws:"
    // In dev mode with Vite proxy, ws://localhost:8443/ws proxies to backend:8000
    // Alternatively fallback directly to 127.0.0.1:8000 if running standalone
    const host = window.location.host || "127.0.0.1:8000"
    return `${protocol}//${host}/ws`
  }

  connect(): void {
    if (typeof window === "undefined") return
    this.shouldConnect = true

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    const wsUrl = this.resolveUrl()
    this.emit("connection", { state: "connecting", detail: wsUrl })

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.retryCount = 0
        this.emit("connection", { state: "connected" })
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          const eventType = message.event as keyof MirageBridgeEvents
          const payload = message.data || message.payload || message

          if (eventType && this.listeners.has(eventType)) {
            this.emit(eventType, payload)
          }
        } catch {
          // Ignore unparseable frames
        }
      }

      this.ws.onerror = (err) => {
        this.emit("connection", { state: "error", detail: String(err) })
      }

      this.ws.onclose = () => {
        this.stopHeartbeat()
        this.emit("connection", { state: "disconnected" })
        if (this.shouldConnect) {
          this.scheduleReconnect()
        }
      }
    } catch (e: any) {
      this.emit("connection", { state: "error", detail: e.message })
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.shouldConnect = false
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.emit("connection", { state: "disconnected" })
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  sendVisionFrame(imageDataUrl: string, mode: string = "sign_language", seq: number = 0): boolean {
    if (!this.isConnected()) return false

    try {
      this.ws!.send(
        JSON.stringify({
          type: "vision_frame",
          image: imageDataUrl,
          mode,
          seq,
        }),
      )
      return true
    } catch {
      return false
    }
  }

  sendText(text: string, detectedLabel?: string, confidence?: number): void {
    if (!this.isConnected()) return

    try {
      this.ws!.send(
        JSON.stringify({
          type: "text",
          text,
          detected_label: detectedLabel,
          confidence,
        }),
      )
    } catch {
      // Ignored
    }
  }

  sendReconstructSign(letters: string[], context?: string): boolean {
    if (!this.isConnected()) return false

    try {
      this.ws!.send(
        JSON.stringify({
          type: "reconstruct_sign",
          letters,
          context,
        }),
      )
      return true
    } catch {
      return false
    }
  }

  on<K extends keyof MirageBridgeEvents>(
    event: K,
    cb: (payload: MirageBridgeEvents[K]) => void,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(cb)
    return () => {
      this.listeners.get(event)?.delete(cb)
    }
  }

  private emit<K extends keyof MirageBridgeEvents>(event: K, payload: MirageBridgeEvents[K]): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(payload)
      } catch (e) {
        console.error(`Error in MirageBridge listener for ${event}:`, e)
      }
    })
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ws!.send(JSON.stringify({ type: "ping" }))
      }
    }, 12000)
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    const delay = Math.min(6000, 1000 * Math.pow(1.5, this.retryCount++))
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.shouldConnect) {
        this.connect()
      }
    }, delay)
  }
}

export const defaultMirageBridge = new WebSocketBridge()

export function createMirageBridge(): MirageBridge {
  return defaultMirageBridge
}
