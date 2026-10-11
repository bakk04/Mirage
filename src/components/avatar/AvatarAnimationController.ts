/**
 * MIRAGE AI — Avatar Blink Controller
 *
 * Manages natural blinking with staggered left/right timing.
 * Uses useState (blinks are infrequent: every 3-6s) so re-renders are rare.
 * No requestAnimationFrame loops, no micro-saccades, no pupil dilation.
 * Respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, useCallback } from "react"
import type { AvatarExpressionState } from "@/types/mirage"
import { getStateConfig } from "./AvatarStateMachine"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const BLINK_MS = 140      // total blink duration
const STAGGER_MS = 22     // right eye starts this many ms after left

export interface BlinkState {
  left: boolean   // true = eye closed
  right: boolean
}

/**
 * Returns the current blink state. Re-renders only during the brief blink
 * (~140ms every 3-6 seconds), which is negligible.
 */
export function useBlinkController(expression: AvatarExpressionState): BlinkState {
  const [blink, setBlink] = useState<BlinkState>({ left: false, right: false })
  const reduced = useReducedMotion()
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  useEffect(() => {
    // Paused state = eyes always closed
    if (expression === "paused") {
      setBlink({ left: true, right: true })
      return
    }
    // Reset eyes open
    setBlink({ left: false, right: false })

    if (reduced) return // no blinking in reduced motion

    const config = getStateConfig(expression)
    const [minMs, maxMs] = config.blinkRange
    let active = true

    const scheduleNext = () => {
      if (!active) return
      const delay = minMs + Math.random() * (maxMs - minMs)

      const t1 = window.setTimeout(() => {
        if (!active) return
        // Left eye closes first
        setBlink({ left: true, right: false })

        // Right eye closes after stagger
        const t2 = window.setTimeout(() => {
          if (!active) return
          setBlink({ left: true, right: true })
        }, STAGGER_MS)
        timersRef.current.push(t2)

        // Both eyes open after full blink duration
        const t3 = window.setTimeout(() => {
          if (!active) return
          setBlink({ left: false, right: false })
          scheduleNext()
        }, BLINK_MS)
        timersRef.current.push(t3)
      }, delay)
      timersRef.current.push(t1)
    }

    scheduleNext()

    return () => {
      active = false
      clearTimers()
    }
  }, [expression, reduced, clearTimers])

  return blink
}
