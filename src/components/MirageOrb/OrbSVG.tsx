import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react"
import type { MirageStateType } from "@/store/mirageStore"
import type { GazeValues } from "@/hooks/useMousePosition"
import { colors, sizes } from "@/lib/designSystem"

interface OrbSVGProps {
  state: MirageStateType
  amplitude: number | MotionValue<number>
  gaze: GazeValues
  size: number
}

export default function OrbSVG({ state, amplitude, gaze, size }: OrbSVGProps) {
  const amplitudeValue = useMotionValue(
    typeof amplitude === "number" ? amplitude : amplitude.get(),
  )
  const amp = typeof amplitude === "number" ? amplitudeValue : amplitude
  const ampScale = useTransform(amp, (value) => 1 + value * 0.09)
  const haloScale = useTransform(amp, (value) => 1 + value * 0.18)
  const haloOpacity = useTransform(amp, (value) => 0.3 + value * 0.28)
  const gazeX = useTransform(gaze.x, (value) => value * 14)
  const gazeY = useTransform(gaze.y, (value) => value * 14)
  const speaking = state === "speaking"
  const imagine = state === "imagine"
  const diameter = size || sizes.orb

  return (
    <motion.div
      className="mirage-orb-container"
      data-testid={
        state === "listening" ? "listening-aura" : "mirage-orb-container"
      }
      style={{ "--orb-diameter": `${diameter}px` } as React.CSSProperties}
    >
      <motion.div
        className="mirage-orb-halo"
        style={{ scale: haloScale, opacity: haloOpacity }}
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      {speaking &&
        [0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute left-1/2 top-1/2 aspect-square rounded-full border border-[#5EEAD4]/40"
            style={{ width: diameter, translateX: "-50%", translateY: "-50%" }}
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{
              duration: 2.4,
              delay: ring * 0.7,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      <motion.div
        className="mirage-orb-sphere"
        style={{ x: gazeX, y: gazeY, scale: ampScale }}
        animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className={`mirage-orb-blob mirage-orb-blob-a ${
            imagine ? "bg-[#FB923C]" : ""
          }`}
        />
        <div className="mirage-orb-blob mirage-orb-blob-b" />
        <div className="mirage-orb-blob mirage-orb-blob-c" />
        <div className="mirage-orb-blob mirage-orb-blob-d" />
        <div className="mirage-orb-core" />
        <div className="mirage-orb-rim" />
      </motion.div>
      <div
        aria-hidden="true"
        className="absolute inset-1/4 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${
            imagine ? colors.orange : colors.turquoise
          }, transparent 70%)`,
          filter: "blur(28px)",
        }}
      />
    </motion.div>
  )
}
