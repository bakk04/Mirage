/**
 * MIRAGE AI - Gesture Command Service
 *
 * MediaPipe Gesture Recognizer & Landmark Processor for Interface Controls.
 * Conceptually separate from linguistic sign language.
 */

import { GestureWorkerClient } from "@/services/gestureWorkerClient"
import { mediaPipeRecognizer } from "@/services/mediaPipeGestureRecognizer"
import { defaultMirageBridge, type GestureCommandPayload } from "@/lib/mirageBridge"
import type {
  GestureCommandResult,
  HandLandmarkPoint,
  ModelIntegrationStatus,
} from "@/types/mirage"

export interface GestureRecognizerConfig {
  modelPath?: string
  minHandDetectionConfidence?: number
  minHandPresenceConfidence?: number
  minTrackingConfidence?: number
}

type CommandListener = (command: GestureCommandResult) => void
type StatusListener = (status: ModelIntegrationStatus, label: string) => void
type LandmarkListener = (landmarks: HandLandmarkPoint[]) => void

export class GestureCommandService {
  private status: ModelIntegrationStatus = "unloaded"
  private statusLabel = "Gesture recognizer initializing"
  private commandListeners = new Set<CommandListener>()
  private statusListeners = new Set<StatusListener>()
  private landmarkListeners = new Set<LandmarkListener>()
  private worker = new GestureWorkerClient()

  public getStatus(): ModelIntegrationStatus {
    return this.status
  }

  public getStatusLabel(): string {
    return this.statusLabel
  }

  public isReady(): boolean {
    return this.status === "ready"
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    listener(this.status, this.statusLabel)
    return () => this.statusListeners.delete(listener)
  }

  public subscribeCommands(listener: CommandListener): () => void {
    this.commandListeners.add(listener)
    return () => this.commandListeners.delete(listener)
  }

  public subscribeLandmarks(listener: LandmarkListener): () => void {
    this.landmarkListeners.add(listener)
    return () => this.landmarkListeners.delete(listener)
  }

  /**
   * Initializes the MediaPipe Gesture Recognizer Web Worker.
   */
  public async initialize(_config?: GestureRecognizerConfig): Promise<boolean> {
    this.status = "initializing"
    this.statusLabel = "Loading MediaPipe Gesture Recognizer"
    this.notifyStatus()

    this.worker.subscribeStatus((status, detail) => {
      this.status = status === "ready" ? "ready" : "error"
      this.statusLabel =
        status === "ready"
          ? "MediaPipe Gesture Recognizer ready"
          : `MediaPipe error: ${detail || "initialization failed"}`
      this.notifyStatus()
    })

    this.worker.subscribe((result) => {
      const landmarks = result.landmarks && result.landmarks.length > 0 ? result.landmarks : []
      this.landmarkListeners.forEach((listener) => listener(landmarks))

      const command = mediaPipeRecognizer.evaluateGesture(
        result.gestureName,
        result.confidence,
        result.landmarks,
      )
      if (command) {
        this.commandListeners.forEach((listener) => listener(command))
      }
    })

    defaultMirageBridge.on("gesture_command", (payload: GestureCommandPayload) => {
      if (payload.status === "ok" && payload.command) {
        const cmd = mediaPipeRecognizer.evaluateGesture(
          payload.gesture_name,
          payload.confidence || 0.85,
        )
        if (cmd) {
          this.commandListeners.forEach((listener) => listener(cmd))
        }
      }
    })

    try {
      await this.worker.initialize()
      return true
    } catch (error) {
      this.status = "error"
      this.statusLabel = `MediaPipe Gesture Recognizer error: ${
        error instanceof Error ? error.message : "initialization failed"
      }`
      this.notifyStatus()
      return false
    }
  }

  /**
   * Landmark processing contract for interface control gestures.
   */
  public processLandmarks(
    landmarks: HandLandmarkPoint[] | null,
  ): GestureCommandResult | null {
    if (!landmarks || landmarks.length === 0) return null
    return mediaPipeRecognizer.evaluateGesture(null, 0.85, landmarks)
  }

  public processVideoFrame(video: HTMLVideoElement | null): void {
    if (!this.isReady() || !video) return
    void this.worker.process(video)
  }

  public dispose(): void {
    this.worker.dispose()
    this.worker = new GestureWorkerClient()
    this.status = "unloaded"
    this.statusLabel = "MediaPipe Gesture Recognizer unloaded"
    this.notifyStatus()
  }

  private notifyStatus() {
    this.statusListeners.forEach((l) => l(this.status, this.statusLabel))
  }
}

export const gestureCommandService = new GestureCommandService()
