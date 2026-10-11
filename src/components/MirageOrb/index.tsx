import { useEffect, useState, type CSSProperties } from "react"
import { motion, useSpring, type MotionValue } from "motion/react"
import OrbSVG from "./OrbSVG"
import type { MirageStateType } from "@/store/mirageStore"
import { useLongPress } from "@/hooks/useLongPress"
import type { GazeValues } from "@/hooks/useMousePosition"
import { sizes } from "@/lib/designSystem"

let webglAvailable: boolean | null = null
function checkWebGL() {
  if (webglAvailable !== null) return webglAvailable
  try {
    const canvas = document.createElement("canvas")
    webglAvailable = Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    )
  } catch {
    webglAvailable = false
  }
  return webglAvailable
}

export interface MirageOrbProps {
  state: MirageStateType
  amplitude: number | MotionValue<number>
  gaze: GazeValues
  size?: number
  layoutId?: string
  onClick?: () => void
  onLongPress?: () => void
}

type OrbWebGLComponent = (props: {
  state: MirageStateType
  amplitude: number | MotionValue<number>
  gaze: GazeValues
  size: number
}) => React.ReactNode

export default function MirageOrb({
  state,
  amplitude,
  gaze,
  size = sizes.orb,
  layoutId = "mirage-orb",
  onClick,
  onLongPress,
}: MirageOrbProps) {
  const [useWebGL] = useState(() => checkWebGL())
  const [OrbWebGL, setOrbWebGL] = useState<OrbWebGLComponent | null>(null)
  const pressHandlers = useLongPress({ onLongPress, onClick })
  const scale = useSpring(
    state === "listening" ? 1.25 : state === "speaking" ? 1.1 : 1,
    {
      stiffness: 120,
      damping: 20,
    },
  )

  useEffect(() => {
    scale.set(
      state === "listening"
        ? 1.25
        : state === "speaking"
          ? 1.1
          : state === "imagine"
            ? 1.5
            : 1,
    )
    return () => scale.stop()
  }, [scale, state])

  useEffect(() => {
    if (!useWebGL) return
    let cancelled = false
    void import("./OrbWebGL")
      .then((mod) => {
        if (!cancelled) setOrbWebGL(() => mod.default)
      })
      .catch(() => setOrbWebGL(null))
    return () => {
      cancelled = true
    }
  }, [useWebGL])

  const containerSize = size * 2.4
  return (
    <motion.div
      layoutId={layoutId}
      data-testid={
        state === "listening" ? "listening-orb-container" : undefined
      }
      className="relative flex cursor-pointer select-none items-center justify-center"
      style={{ width: containerSize, height: containerSize, scale }}
      {...pressHandlers}
      whileTap={{ scale: 0.97 }}
    >
      {OrbWebGL && useWebGL ? (
        <OrbWebGL state={state} amplitude={amplitude} gaze={gaze} size={size} />
      ) : (
        <OrbSVG state={state} amplitude={amplitude} gaze={gaze} size={size} />
      )}
    </motion.div>
  )
}
