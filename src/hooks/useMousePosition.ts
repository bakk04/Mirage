import { useEffect, useMemo } from "react"
import { useMotionValue, useSpring, type MotionValue } from "motion/react"
import { useReducedMotion } from "./useReducedMotion"

export interface GazeValues {
  x: MotionValue<number>
  y: MotionValue<number>
}

export function useMousePosition(): GazeValues {
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 60, damping: 15 })
  const springY = useSpring(y, { stiffness: 60, damping: 15 })

  useEffect(() => {
    if (reduced) {
      x.set(0)
      y.set(0)
      return
    }

    let frame = 0
    let nextX = 0
    let nextY = 0
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    let lookTimer: ReturnType<typeof setInterval> | undefined
    let lookStopTimer: ReturnType<typeof setTimeout> | undefined

    const clearLookAround = () => {
      if (lookTimer) clearInterval(lookTimer)
      if (lookStopTimer) clearTimeout(lookStopTimer)
      lookTimer = undefined
      lookStopTimer = undefined
    }

    const scheduleLookAround = () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        clearLookAround()
        let phase = 0
        lookTimer = setInterval(() => {
          phase += 0.04
          x.set(Math.sin(phase) * 0.4)
          y.set(Math.cos(phase * 0.7) * 0.3)
        }, 1000 / 30)
        lookStopTimer = setTimeout(clearLookAround, 3000)
      }, 6000)
    }

    const onMove = (event: MouseEvent) => {
      nextX = (event.clientX / window.innerWidth - 0.5) * 2
      nextY = (event.clientY / window.innerHeight - 0.5) * 2
      if (!frame) {
        frame = requestAnimationFrame(() => {
          x.set(nextX)
          y.set(nextY)
          frame = 0
        })
      }
      clearLookAround()
      scheduleLookAround()
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    scheduleLookAround()
    return () => {
      window.removeEventListener("mousemove", onMove)
      if (frame) cancelAnimationFrame(frame)
      if (idleTimer) clearTimeout(idleTimer)
      clearLookAround()
    }
  }, [reduced, x, y])

  return useMemo(() => ({ x: springX, y: springY }), [springX, springY])
}
