/**
 * MIRAGE AI - Gesture Command Service (Integration Interface)
 *
 * RESERVED FOR FUTURE MODEL 2: MediaPipe Gesture Recognizer — Interface Commands
 *
 * Current Status: Awaiting gesture recognizer integration
 * MediaPipe Gesture Recognizer is intended for interface commands (e.g. start/stop, clear transcript),
 * completely separate from Arabic linguistic sign language.
 * This service provides the event contract for when the MediaPipe model is supplied.
 */

import { GestureWorkerClient } from "@/services/gestureWorkerClient"
import { mediaPipeRecognizer } from "@/services/mediaPipeGestureRecognizer"
import type {
  GestureCommandResult,
  GestureCommandType,
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

export class GestureCommandService {
  private status: ModelIntegrationStatus = "awaiting_integration"
  private statusLabel = "Awaiting gesture recognizer integration"
  private commandListeners = new Set<CommandListener>()
  private statusListeners = new Set<StatusListener>()
  private lastTriggerTime: Record<string, number> = {}
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

  /**
   * MediaPipe model initialization contract.
   * Truthfully reports awaiting integration until the MediaPipe bundle is provided.
   */
  public async initialize(config?: GestureRecognizerConfig): Promise<boolean> {
    this.status = "initializing"
    this.statusLabel = "Loading MediaPipe Gesture Recognizer"
    this.notifyStatus()
    this.worker.subscribeStatus((status, detail) => {
      this.status = status === "ready" ? "ready" : "error"
      this.statusLabel =
        status === "ready"
          ? "MediaPipe Gesture Recognizer ready"
          : `MediaPipe Gesture Recognizer error: ${detail || "unknown error"}`
      this.notifyStatus()
    })
    this.worker.subscribe((result) => {
      const command = mediaPipeRecognizer.evaluateGesture(
        result.gestureName,
        result.confidence,
      )
      if (command) {
        this.commandListeners.forEach((listener) => listener(command))
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
    if (!this.isReady() || !landmarks || landmarks.length === 0) {
      return null
    }

    // Future MediaPipe Gesture Recognizer execution:
    // 1. Analyze hand landmarks geometry
    // 2. Classify interface control gesture
    // 3. Apply cooldown and validation
    return null
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
