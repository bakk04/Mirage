/**
 * MIRAGE AI - MediaPipe Gesture Recognizer Service
 *
 * Conceptually SEPARATE from linguistic sign recognition (MobileNetV2).
 * Handles application control commands with cooldowns, threshold validation,
 * and accessible alternatives.
 */

import type { GestureCommand, GestureCommandType } from "@/types/mirage"

export interface SupportedGestureMapping {
  gestureName: string
  commandType: GestureCommandType
  label: string
  description: string
  minConfidence: number
  requiresConfirmation: boolean
  cooldownMs: number
}

// Explicit mapping of physical gestures to application commands
export const MEDIAPIPE_GESTURE_COMMANDS: SupportedGestureMapping[] = [
  {
    gestureName: "Open_Palm",
    commandType: "pause_resume",
    label: "Pause / Resume Session",
    description: "Temporarily suspends or resumes sign recognition",
    minConfidence: 0.82,
    requiresConfirmation: false,
    cooldownMs: 2000,
  },
  {
    gestureName: "Pointing_Up",
    commandType: "repeat_speech",
    label: "Repeat Spoken Translation",
    description: "Re-vocalizes the last confirmed translation aloud",
    minConfidence: 0.85,
    requiresConfirmation: false,
    cooldownMs: 2200,
  },
  {
    gestureName: "Victory",
    commandType: "switch_mode",
    label: "Switch Language / Mode",
    description: "Toggles between supported sign language pipelines",
    minConfidence: 0.85,
    requiresConfirmation: false,
    cooldownMs: 2500,
  },
  {
    gestureName: "Closed_Fist",
    commandType: "stop_session",
    label: "Stop Translation Session",
    description: "Concludes the active sign recognition session",
    minConfidence: 0.88,
    requiresConfirmation: true, // Sensitive action
    cooldownMs: 3000,
  },
  {
    gestureName: "Thumb_Up",
    commandType: "confirm_action",
    label: "Confirm Action",
    description: "Confirms pending draft or active modal prompt",
    minConfidence: 0.86,
    requiresConfirmation: false,
    cooldownMs: 1800,
  },
]

type CommandTriggerListener = (cmd: GestureCommand) => void

class MediaPipeGestureRecognizerService {
  private lastTriggerTime: Record<GestureCommandType, number> = {
    pause_resume: 0,
    repeat_speech: 0,
    switch_mode: 0,
    clear_transcript: 0,
    toggle_audio: 0,
    stop_session: 0,
    confirm_action: 0,
    cancel_action: 0,
    start_session: 0,
    open_guide: 0,
    open_diagnostics: 0,
  }

  private listeners = new Set<CommandTriggerListener>()

  public subscribeCommand(listener: CommandTriggerListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Evaluates detected MediaPipe hand gesture against the command lexicon.
   * Returns a valid GestureCommand only if threshold and cooldown conditions are met.
   */
  public evaluateGesture(
    rawGestureName: string | null | undefined,
    confidence: number,
  ): GestureCommand | null {
    if (!rawGestureName) return null
    const now = Date.now()

    const mapping = MEDIAPIPE_GESTURE_COMMANDS.find(
      (m) => m.gestureName.toLowerCase() === rawGestureName.toLowerCase(),
    )

    if (!mapping) return null

    // Check confidence threshold
    if (confidence < mapping.minConfidence) return null

    // Check cooldown to prevent accidental repeat firing
    const lastTime = this.lastTriggerTime[mapping.commandType] || 0
    if (now - lastTime < mapping.cooldownMs) {
      return null
    }

    this.lastTriggerTime[mapping.commandType] = now

    const command: GestureCommand = {
      commandId: `cmd-${now}`,
      commandType: mapping.commandType,
      type: mapping.commandType,
      label: mapping.label,
      description: mapping.description,
      gestureDescription: mapping.gestureName.replace("_", " "),
      confidence: Number(confidence.toFixed(2)),
      timestamp: now,
      status: mapping.requiresConfirmation ? "pending" : "executing",
      requiresConfirmation: mapping.requiresConfirmation,
    }

    this.listeners.forEach((l) => l(command))
    return command
  }
}

export const mediaPipeRecognizer = new MediaPipeGestureRecognizerService()
