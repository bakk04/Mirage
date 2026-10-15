/**
 * MIRAGE AI - Number & Basic Gesture Recognition Service
 *
 * Dedicated recognition engine for numbers 0, 1, 2, 3, 4, 5 and basic gestures
 * using direct geometric hand landmark analysis.
 *
 * Strict Rules:
 * - Completely isolated from linguistic sign-language translation.
 * - Anti-loop state machine: confirms once after consecutive stable frames.
 * - Locked while held: will NOT emit repeated events until gesture changes or hand resets.
 * - Explicit rejection: unrecognized hand configurations display "Geste non reconnu".
 */

import type { HandLandmarkPoint, NumberGestureResult } from "@/types/mirage"

export type NumberGestureListener = (result: NumberGestureResult) => void

export class NumberGestureService {
  private consecutiveFramesNeeded = 3
  private consecutiveCount = 0
  private candidateNumber: number | null = null
  private lockedNumber: number | null = null
  private noHandCount = 0
  private lastConfirmedTime = 0
  private listeners = new Set<NumberGestureListener>()

  public subscribe(listener: NumberGestureListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(result: NumberGestureResult): void {
    this.listeners.forEach((l) => l(result))
  }

  /**
   * Resets the internal state machine.
   */
  public reset(): void {
    this.candidateNumber = null
    this.consecutiveCount = 0
    this.lockedNumber = null
    this.noHandCount = 0
  }

  /**
   * Evaluates hand landmarks for numbers 0 to 5 or unrecognized gesture.
   */
  public evaluateLandmarks(
    landmarks: HandLandmarkPoint[] | null | undefined,
  ): NumberGestureResult {
    const now = Date.now()

    // 1. Hand presence validation
    if (!landmarks || landmarks.length < 21) {
      this.noHandCount++
      this.consecutiveCount = 0
      this.candidateNumber = null

      // Unlock after 2 frames of no hand (neutral re-arm)
      if (this.noHandCount >= 2) {
        this.lockedNumber = null
      }

      const noHandResult: NumberGestureResult = {
        number: -1,
        label: "",
        confidence: 0,
        timestamp: now,
        isConfirmed: false,
        isProvisional: true,
        state: "no_hand",
      }
      this.notify(noHandResult)
      return noHandResult
    }

    this.noHandCount = 0

    // 2. Hand scale validation (ensure hand is sufficiently close and visible)
    const wrist = landmarks[0]
    const middleMcp = landmarks[9]
    const handSpan = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y)
    if (handSpan < 0.07) {
      // Hand too small / distant to measure reliably
      const tooFarResult: NumberGestureResult = {
        number: -1,
        label: "Geste non reconnu",
        confidence: 0.3,
        timestamp: now,
        isConfirmed: false,
        isProvisional: true,
        state: "unrecognized",
      }
      this.notify(tooFarResult)
      return tooFarResult
    }

    // 3. Extract finger states (extended vs curled)
    const fingers = this.analyzeFingers(landmarks)
    const { thumb, index, middle, ring, pinky, confidence } = fingers

    // 4. Classify number
    const detectedNumber = this.classifyNumber(thumb, index, middle, ring, pinky)

    const label =
      detectedNumber >= 0 ? `${detectedNumber}` : "Geste non reconnu"
    const state: NumberGestureResult["state"] =
      detectedNumber >= 0 ? "detected" : "unrecognized"

    // 5. State Machine & Anti-Repetition Logic
    if (detectedNumber === this.candidateNumber) {
      this.consecutiveCount++
    } else {
      this.candidateNumber = detectedNumber
      this.consecutiveCount = 1
    }

    // Check if stable enough to confirm
    const isStable = this.consecutiveCount >= this.consecutiveFramesNeeded
    const isNewGesture = detectedNumber !== this.lockedNumber

    if (isStable && isNewGesture) {
      // CONFIRMED EVENT - Emit ONCE and LOCK
      this.lockedNumber = detectedNumber
      this.lastConfirmedTime = now

      const confirmedResult: NumberGestureResult = {
        number: detectedNumber,
        label,
        confidence,
        timestamp: now,
        isConfirmed: true,
        isProvisional: false,
        state,
      }
      this.notify(confirmedResult)
      return confirmedResult
    }

    // Provisional / holding state (already confirmed & locked, or still stabilizing)
    const provisionalResult: NumberGestureResult = {
      number: detectedNumber,
      label: this.lockedNumber !== null && this.lockedNumber === detectedNumber ? `${this.lockedNumber}` : label,
      confidence,
      timestamp: now,
      isConfirmed: false,
      isProvisional: true,
      state,
    }
    this.notify(provisionalResult)
    return provisionalResult
  }

  /**
   * Geometrically determines extension state of each digit.
   */
  private analyzeFingers(landmarks: HandLandmarkPoint[]): {
    thumb: boolean
    index: boolean
    middle: boolean
    ring: boolean
    pinky: boolean
    confidence: number
  } {
    const wrist = landmarks[0]
    const thumbCmc = landmarks[1]
    const thumbMcp = landmarks[2]
    const thumbIp = landmarks[3]
    const thumbTip = landmarks[4]

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

    // Fingers extension based on wrist distance ratio
    // Tip must be significantly farther from wrist than PIP
    const isIndexExtended = dist(wrist, indexTip) > dist(wrist, indexPip) * 1.18 &&
      dist(wrist, indexTip) > dist(wrist, indexMcp) * 1.3

    const isMiddleExtended = dist(wrist, middleTip) > dist(wrist, middlePip) * 1.18 &&
      dist(wrist, middleTip) > dist(wrist, middleMcp) * 1.3

    const isRingExtended = dist(wrist, ringTip) > dist(wrist, ringPip) * 1.18 &&
      dist(wrist, ringTip) > dist(wrist, ringMcp) * 1.3

    const isPinkyExtended = dist(wrist, pinkyTip) > dist(wrist, pinkyPip) * 1.18 &&
      dist(wrist, pinkyTip) > dist(wrist, pinkyMcp) * 1.3

    // Thumb extension:
    // Distance from thumb tip to index MCP vs thumb IP to index MCP,
    // plus distance from wrist to thumb tip vs wrist to thumb MCP
    const thumbTipToIndexBase = dist(thumbTip, indexMcp)
    const thumbIpToIndexBase = dist(thumbIp, indexMcp)
    const thumbTipToWrist = dist(wrist, thumbTip)
    const thumbMcpToWrist = dist(wrist, thumbMcp)

    const isThumbExtended =
      thumbTipToIndexBase > thumbIpToIndexBase * 1.15 &&
      thumbTipToWrist > thumbMcpToWrist * 1.25

    // Overall quality confidence
    const confidence = 0.92

    return {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended,
      confidence,
    }
  }

  /**
   * Deterministically maps finger combinations to numbers 0-5.
   */
  private classifyNumber(
    thumb: boolean,
    index: boolean,
    middle: boolean,
    ring: boolean,
    pinky: boolean,
  ): number {
    // 5: All 5 fingers extended
    if (thumb && index && middle && ring && pinky) {
      return 5
    }

    // 4: Four fingers up (index, middle, ring, pinky), thumb folded
    if (!thumb && index && middle && ring && pinky) {
      return 4
    }

    // 3: Three fingers:
    // Standard: index, middle, ring extended (thumb & pinky curled)
    // Or European/MENA standard: thumb, index, middle extended (ring & pinky curled)
    if (!thumb && index && middle && ring && !pinky) {
      return 3
    }
    if (thumb && index && middle && !ring && !pinky) {
      return 3
    }

    // 2: Two fingers: index and middle (peace/V sign)
    if (!thumb && index && middle && !ring && !pinky) {
      return 2
    }

    // 1: One finger: index finger up
    if (!thumb && index && !middle && !ring && !pinky) {
      return 1
    }

    // 0: Fist / No fingers extended
    if (!thumb && !index && !middle && !ring && !pinky) {
      return 0
    }

    // Any other irregular or unsupported configuration
    return -1
  }
}

export const numberGestureService = new NumberGestureService()
