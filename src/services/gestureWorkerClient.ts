import modelAssetUrl from "../../models/gesture_command_mediapipe/gesture_recognizer.task?url"
import type { HandLandmarkPoint } from "@/types/mirage"

// These version-matched files are copied from @mediapipe/tasks-vision during
// project setup so the worker does not depend on a CDN at runtime.
const wasmRootUrl = "/mediapipe/wasm"

export interface GestureWorkerResult {
  gestureName: string | null
  confidence: number
  landmarks: HandLandmarkPoint[]
}

type ResultListener = (result: GestureWorkerResult) => void
type StatusListener = (status: "ready" | "error", detail?: string) => void

export class GestureWorkerClient {
  private worker: Worker | null = null
  private busy = false
  private initialized = false
  private sequence = 0
  private resultListeners = new Set<ResultListener>()
  private statusListeners = new Set<StatusListener>()

  subscribe(listener: ResultListener) {
    this.resultListeners.add(listener)
    return () => this.resultListeners.delete(listener)
  }

  subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  async initialize() {
    if (this.initialized) return
    this.worker?.terminate()
    this.worker = new Worker(
      new URL("../workers/gestureRecognizer.worker.ts", import.meta.url),
      {
        type: "module",
      },
    )
    this.worker.onmessage = (event) => this.handleMessage(event.data)
    this.worker.onerror = (event) => this.handleError(event.message)
    this.worker.postMessage({ type: "init", modelAssetUrl, wasmRootUrl })
    this.initialized = true
  }

  async process(video: HTMLVideoElement) {
    if (
      !this.worker ||
      this.busy ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    )
      return
    this.busy = true
    const bitmap = await createImageBitmap(video)
    this.worker.postMessage({ type: "frame", id: ++this.sequence, bitmap }, [
      bitmap,
    ])
  }

  dispose() {
    this.worker?.terminate()
    this.worker = null
    this.busy = false
    this.initialized = false
  }

  private handleMessage(message: any) {
    if (message.type === "ready") {
      this.statusListeners.forEach((listener) => listener("ready"))
      return
    }
    if (message.type === "error") {
      this.busy = false
      this.handleError(message.message)
      return
    }
    if (message.type === "result") {
      this.busy = false
      const category = message.result.gestures[0]?.[0]
      this.resultListeners.forEach((listener) =>
        listener({
          gestureName: category?.categoryName ?? null,
          confidence: category?.score ?? 0,
          landmarks: message.result.landmarks[0] ?? [],
        }),
      )
    }
  }

  private handleError(message: string) {
    this.statusListeners.forEach((listener) => listener("error", message))
  }
}
