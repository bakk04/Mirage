"use client" /* CSS bloom behind canvas */
import { useState, useEffect } from "react"
import { motion, useSpring } from "motion/react"
import OrbSVG from "./OrbSVG"
import type { MirageStateType } from "@/store/mirageStore"
import { useLongPress } from "@/hooks/useLongPress"
import type { GazeValues } from "@/hooks/useMousePosition"

let webglAvailable: boolean | null = null
function checkWebGL(): boolean {
  if (webglAvailable !== null) return webglAvailable
  try {
    const canvas = document.createElement("canvas")
    webglAvailable = !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    )
  } catch {
    webglAvailable = false
  }
  return webglAvailable
}

export interface MirageOrbProps {
  state: MirageStateType
  amplitude: number
  gaze: GazeValues
  size?: number
  layoutId?: string
  onClick?: () => void
  onLongPress?: () => void
}

type OrbWebGLComponent = (props: {
  state: MirageStateType
  amplitude: number
  gaze: GazeValues
  size: number
}) => React.ReactNode

export default function MirageOrb({
  state,
  amplitude,
  gaze,
  size = 240,
  layoutId = "mirage-orb",
  onClick,
  onLongPress,
}: MirageOrbProps) {
  const [useWebGL] = useState(() => checkWebGL())
  const [OrbWebGL, setOrbWebGL] = useState<OrbWebGLComponent | null>(null)

  useEffect(() => {
    if (useWebGL) {
      import("./OrbWebGL")
        .then((mod) => setOrbWebGL(() => mod.default))
        .catch(() => setOrbWebGL(null))
    }
  }, [useWebGL])

  const pressHandlers = useLongPress({ onLongPress, onClick })

  const scale = useSpring(
    state === "listening" ? 1.25 : state === "speaking" ? 1.1 : 1,
    { stiffness: 120, damping: 20 },
  )

  useEffect(() => {
    scale.set(
      state === "listening"
        ? 1.25
        : state === "imagine"
          ? 1.5
          : state === "speaking"
            ? 1.1
            : 1,
    )
  }, [state, scale])

  return (
    <motion.div
      layoutId={layoutId}
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ width: size, height: size, scale }}
      {...pressHandlers}
      whileTap={{ scale: 0.97 }}
    >
      {}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            state === "imagine"
              ? "radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 65%)"
              : "radial-gradient(circle, rgba(94,234,212,0.2) 0%, transparent 65%)",
          filter: "blur(50px)",
          animation: "orb-breathe 4s ease-in-out infinite",
          transform: `scale(${1 + amplitude * 0.25})`,
          transition: "transform 0.1s ease-out, background 1s ease",
        }}
      />

      {OrbWebGL && useWebGL ? (
        <OrbWebGL state={state} amplitude={amplitude} gaze={gaze} size={size} />
      ) : (
        <OrbSVG state={state} amplitude={amplitude} gaze={gaze} size={size} />
      )}
    </motion.div>
  )
}
