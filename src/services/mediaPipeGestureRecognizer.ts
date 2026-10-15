/**
 * MIRAGE AI - MediaPipe Gesture Recognizer & Browser Controller Service
 *
 * Handles predefined browser control gestures and application commands:
 * - Gesture 5: Close current browser tab / window (close_tab)
 * - Gesture 2 — Up: Scroll current page upward (scroll_up)
 * - Gesture 2 — Down: Scroll current page downward (scroll_down)
 * - Gesture 3: Refresh current page (refresh_page)
 *
 * Implements geometric landmark verification, temporal velocity tracking,
 * hold duration stability, neutral-state re-arming, and cooldown locks.
 */

import type {
  GestureCommand,
  GestureCommandType,
  HandLandmarkPoint,
} from "@/types/mirage"

export interface SupportedGestureMapping {
  gestureName: string
  commandType: GestureCommandType
  label: string
  description: string
  minConfidence: number
  requiresConfirmation: boolean
  cooldownMs: number
}

// Predefined mapping of physical gestures to browser controls and application actions
export const MEDIAPIPE_GESTURE_COMMANDS: SupportedGestureMapping[] = [
  {
    gestureName: "Five_Fingers",
    commandType: "close_tab",
    label: "Gesture 5: Close Tab / Exit",
    description: "Request to close current browser tab or window",
    minConfidence: 0.82,
    requiresConfirmation: true, // Destructive action requires confirmation
    cooldownMs: 3000,
  },
  {
    gestureName: "Open_Palm",
    commandType: "close_tab",
    label: "Gesture 5: Close Tab / Exit",
    description: "Request to close current browser tab or window",
    minConfidence: 0.82,
    requiresConfirmation: true,
    cooldownMs: 3000,
  },
  {
    gestureName: "Two_Fingers_Up",
    commandType: "scroll_up",
    label: "Gesture 2 — Up: Scroll Up",
    description: "Scrolls the current page upward smoothly",
    minConfidence: 0.75,
    requiresConfirmation: false,
    cooldownMs: 1200,
  },
  {
    gestureName: "Two_Fingers_Down",
    commandType: "scroll_down",
    label: "Gesture 2 — Down: Scroll Down",
    description: "Scrolls the current page downward smoothly",
    minConfidence: 0.75,
    requiresConfirmation: false,
    cooldownMs: 1200,
  },
  {
    gestureName: "Three_Fingers",
    commandType: "refresh_page",
    label: "Gesture 3: Refresh Page",
    description: "Refreshes / reloads the current page",
    minConfidence: 0.80,
    requiresConfirmation: false,
    cooldownMs: 2500,
  },
  {
    gestureName: "Closed_Fist",
    commandType: "pause_resume",
    label: "Pause / Resume Session",
    description: "Temporarily suspends or resumes recognition",
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
    gestureName: "Thumb_Up",
    commandType: "confirm_action",
    label: "Confirm Action",
    description: "Confirms pending prompt or dialog",
    minConfidence: 0.85,
    requiresConfirmation: false,
    cooldownMs: 1800,
  },
]

export interface LandmarkAnalysis {
  gesture: string | null
  confidence: number
  isTwoFingersUp: boolean
  isTwoFingersDown: boolean
  isThreeFingers: boolean
  isFiveFingersOpen: boolean
  handSpan: number
  motionDy: number
}

// Temporal tracking of landmark positions for dynamic gesture classification
let prevWristY: number | null = null
let prevTimestamp = 0

/**
 * Geometric and temporal analysis of 21 MediaPipe hand landmarks.
 */
export function analyzeHandLandmarks(
  landmarks: HandLandmarkPoint[] | null | undefined,
): LandmarkAnalysis {
  const now = performance.now()
  if (!landmarks || landmarks.length < 21) {
    prevWristY = null
    return {
      gesture: null,
      confidence: 0,
      isTwoFingersUp: false,
      isTwoFingersDown: false,
      isThreeFingers: false,
      isFiveFingersOpen: false,
      handSpan: 0,
      motionDy: 0,
    }
  }

  const wrist = landmarks[0]
  const thumbTip = landmarks[4]
  const thumbMcp = landmarks[2]
  const indexMcp = landmarks[5]
  const indexPip = landmarks[6]
  const indexTip = landmarks[8]
  const middleMcp = landmarks[9]
  const middlePip = landmarks[10]
  const middleTip = landmarks[12]
  const ringMcp = landmarks[13]
  const ringPip = landmarks[14]
  const ringTip = landmarks[16]
  const pinkyMcp = landmarks[17]
  const pinkyPip = landmarks[18]
  const pinkyTip = landmarks[20]

  const dist = (p1: HandLandmarkPoint, p2: HandLandmarkPoint) =>
    Math.hypot(p1.x - p2.x, p1.y - p2.y)

  // Hand size validation: reject if hand is too small/far away (handSpan < 0.075)
  const handSpan = dist(wrist, middleMcp)
  if (handSpan < 0.075) {
    return {
      gesture: null,
      confidence: 0,
      isTwoFingersUp: false,
      isTwoFingersDown: false,
      isThreeFingers: false,
      isFiveFingersOpen: false,
      handSpan,
      motionDy: 0,
    }
  }

  // Finger extensions (using MCP-to-tip vs MCP-to-pip for rotation-invariant extension detection)
  const isIndexExtended = dist(indexMcp, indexTip) > dist(indexMcp, indexPip) * 1.2
  const isMiddleExtended = dist(middleMcp, middleTip) > dist(middleMcp, middlePip) * 1.2
  const isRingExtended = dist(ringMcp, ringTip) > dist(ringMcp, ringPip) * 1.2
  const isRingCurled = dist(ringMcp, ringTip) < dist(ringMcp, ringPip) * 1.15
  const isPinkyExtended = dist(pinkyMcp, pinkyTip) > dist(pinkyMcp, pinkyPip) * 1.2
  const isPinkyCurled = dist(pinkyMcp, pinkyTip) < dist(pinkyMcp, pinkyPip) * 1.15
  const isThumbExtended =
    dist(wrist, thumbTip) > dist(wrist, thumbMcp) * 1.15 ||
    dist(thumbMcp, thumbTip) > dist(thumbMcp, landmarks[3]) * 1.15

  // Temporal motion velocity (dy/dt)
  let motionDy = 0
  if (prevWristY !== null && prevTimestamp > 0) {
    const dt = Math.max(16, now - prevTimestamp)
    motionDy = ((wrist.y - prevWristY) / dt) * 1000 // Normalized units per second
  }
  prevWristY = wrist.y
  prevTimestamp = now

  // GESTURE 5: All 5 fingers extended / Open Palm
  const isFiveFingersOpen =
    isThumbExtended &&
    isIndexExtended &&
    isMiddleExtended &&
    isRingExtended &&
    isPinkyExtended

  // GESTURE 3: Three fingers extended (index, middle, ring), pinky curled
  const isThreeFingers =
    isIndexExtended &&
    isMiddleExtended &&
    isRingExtended &&
    isPinkyCurled

  // GESTURE 2: Index and Middle extended, Ring and Pinky curled
  // Direction check: tips are above MCPs in screen space for UP (y is inverted)
  const indexDy = indexTip.y - indexMcp.y
  const indexDx = indexTip.x - indexMcp.x
  const middleDy = middleTip.y - middleMcp.y
  const middleDx = middleTip.x - middleMcp.x

  const isTwoFingersStaticUp =
    isIndexExtended &&
    isMiddleExtended &&
    isRingCurled &&
    isPinkyCurled &&
    indexDy < -0.05 &&
    middleDy < -0.05 &&
    Math.abs(indexDx) < Math.abs(indexDy) * 1.1

  const isTwoFingersStaticDown =
    isIndexExtended &&
    isMiddleExtended &&
    isRingCurled &&
    isPinkyCurled &&
    indexDy > 0.05 &&
    middleDy > 0.05 &&
    Math.abs(indexDx) < Math.abs(indexDy) * 1.1

  const isTwoFingersUp =
    isTwoFingersStaticUp ||
    (isIndexExtended && isMiddleExtended && isRingCurled && isPinkyCurled && motionDy < -0.25)

  const isTwoFingersDown =
    isTwoFingersStaticDown ||
    (isIndexExtended && isMiddleExtended && isRingCurled && isPinkyCurled && motionDy > 0.25)

  let gesture: string | null = null
  let confidence = 0

  if (isFiveFingersOpen) {
    gesture = "Five_Fingers"
    confidence = 0.90
  } else if (isThreeFingers) {
    gesture = "Three_Fingers"
    confidence = 0.88
  } else if (isTwoFingersUp) {
    gesture = "Two_Fingers_Up"
    confidence = 0.89
  } else if (isTwoFingersDown) {
    gesture = "Two_Fingers_Down"
    confidence = 0.89
  }

  return {
    gesture,
    confidence,
    isTwoFingersUp,
    isTwoFingersDown,
    isThreeFingers,
    isFiveFingersOpen,
    handSpan,
    motionDy,
  }
}

type CommandTriggerListener = (cmd: GestureCommand) => void

class MediaPipeGestureRecognizerService {
  private lastTriggerTime: Record<string, number> = {}
  private listeners = new Set<CommandTriggerListener>()

  // Temporal hold and re-arming state
  private recentCandidates: string[] = []
  private isArmed = true
  private neutralDuration = 0
  private lastEvaluationTime = 0

  public subscribeCommand(listener: CommandTriggerListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Evaluates detected MediaPipe hand gesture and landmarks against the command lexicon.
   * Enforces geometric validation, hold duration, cooldown, and neutral-state re-arming.
   */
  public evaluateGesture(
    rawGestureName: string | null | undefined,
    confidence: number,
    landmarks?: HandLandmarkPoint[] | null,
  ): GestureCommand | null {
    const now = Date.now()
    const dt = this.lastEvaluationTime > 0 ? now - this.lastEvaluationTime : 50
    this.lastEvaluationTime = now

    // Perform geometric landmark and motion velocity analysis
    const geoAnalysis = analyzeHandLandmarks(landmarks)
    const effectiveGestureName =
      geoAnalysis.gesture || rawGestureName || null
    const effectiveConfidence = Math.max(confidence, geoAnalysis.confidence)

    // Neutral state tracking
    if (!effectiveGestureName || effectiveGestureName === "None") {
      this.neutralDuration += dt
      // Re-arm after 250ms of neutral state (prevents repeat triggers while held)
      if (this.neutralDuration >= 250) {
        this.isArmed = true
        this.recentCandidates = []
      }
      return null
    }

    this.neutralDuration = 0

    // If disarmed, wait until user releases the gesture
    if (!this.isArmed) {
      return null
    }

    const mapping = MEDIAPIPE_GESTURE_COMMANDS.find(
      (m) => m.gestureName.toLowerCase() === effectiveGestureName.toLowerCase(),
    )

    if (!mapping) {
      this.recentCandidates = []
      return null
    }

    // Check confidence threshold
    if (effectiveConfidence < mapping.minConfidence) {
      return null
    }

    // Check cooldown
    const lastTime = this.lastTriggerTime[mapping.commandType] || 0
    if (now - lastTime < mapping.cooldownMs) {
      return null
    }

    // Hold duration: require at least 2 consecutive frames agreeing on the gesture
    this.recentCandidates.push(effectiveGestureName)
    if (this.recentCandidates.length > 5) {
      this.recentCandidates.shift()
    }
    const matchingVotes = this.recentCandidates.filter(
      (c) => c === effectiveGestureName,
    ).length
    if (matchingVotes < 2) {
      return null
    }

    // Fire command and DISARM until neutral state transition
    this.lastTriggerTime[mapping.commandType] = now
    this.isArmed = false
    this.recentCandidates = []

    const command: GestureCommand = {
      commandId: `cmd-${now}`,
      commandType: mapping.commandType,
      type: mapping.commandType,
      label: mapping.label,
      description: mapping.description,
      gestureDescription: mapping.gestureName.replace(/_/g, " "),
      confidence: Number(effectiveConfidence.toFixed(2)),
      timestamp: now,
      status: mapping.requiresConfirmation ? "pending" : "executing",
      requiresConfirmation: mapping.requiresConfirmation,
    }

    this.listeners.forEach((l) => l(command))
    return command
  }
}

export const mediaPipeRecognizer = new MediaPipeGestureRecognizerService()
