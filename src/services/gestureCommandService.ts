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
    this.status = "awaiting_integration"
    this.statusLabel = "Awaiting gesture recognizer integration"
    this.notifyStatus()
    return false
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

  private notifyStatus() {
    this.statusListeners.forEach((l) => l(this.status, this.statusLabel))
  }
}

export const gestureCommandService = new GestureCommandService()
