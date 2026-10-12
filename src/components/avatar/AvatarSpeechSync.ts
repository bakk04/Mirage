/**
 * MIRAGE AI — Avatar Speech Synchronization
 *
 * Exposes a Framer Motion MotionValue of smoothed speech amplitude.
 * The MotionValue updates at 60fps via rAF but causes ZERO React re-renders.
 * MirageAvatar uses useTransform() to derive mouth scale from this value.
 */

import { useEffect, useRef } from "react"
import { useMotionValue, type MotionValue } from "motion/react"
import { speechService } from "@/services/speechService"

const ATTACK = 0.38 // fast open
const RELEASE = 0.1 // slow close
const SILENCE = 0.03 // below this → closing

/**
 * Returns a MotionValue<number> (0 – 1) representing smoothed speech amplitude.
 * Drives mouth animation without triggering React renders.
 */
export function useSpeechAmplitude(): MotionValue<number> {
  const mv = useMotionValue(0)

  const stateRef = useRef({
    raw: 0,
    smooth: 0,
    frameId: 0,
    active: true,
  })

  useEffect(() => {
    const s = stateRef.current
    s.active = true
    s.smooth = 0

    const unsub = speechService.subscribeAmplitude((a) => {
      s.raw = a
    })

    const tick = () => {
      if (!s.active) return
      const alpha = s.raw > s.smooth ? ATTACK : RELEASE
      s.smooth += alpha * (s.raw - s.smooth)
      // Snap to zero when very quiet to prevent endless micro-drift
      if (s.smooth < 0.005 && s.raw < SILENCE) s.smooth = 0
      mv.set(s.smooth)
      s.frameId = requestAnimationFrame(tick)
    }
    s.frameId = requestAnimationFrame(tick)

    return () => {
      s.active = false
      cancelAnimationFrame(s.frameId)
      unsub()
      mv.set(0)
    }
  }, [mv])

  return mv
}
