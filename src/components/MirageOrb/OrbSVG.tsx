"use client" /* Outer CSS glow bloom */ /* SVG crescents */ /* Crescent clip mask 1 */ /* Crescent 1 — rotates slowly CW */ /* outer circle minus inner = crescent via mask */ /* Edge glow */ /* Crescent 2 — counter-rotates */ /* Inner core radial glow */ /* 24 particles */ /* Floor reflection */
import { motion, useTransform } from "motion/react"
import type { MirageStateType } from "@/store/mirageStore"
import type { GazeValues } from "@/hooks/useMousePosition"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface OrbSVGProps {
  state: MirageStateType
  amplitude: number
  gaze: GazeValues
  size: number
}

export default function OrbSVG({ state, amplitude, gaze, size }: OrbSVGProps) {
  const isImagine = state === "imagine"
  const isListening = state === "listening"
  const isSpeaking = state === "speaking"
  const isThinking = state === "understanding" || state === "conversation"
  const reduced = useReducedMotion()

  const gazeX = useTransform(gaze.x, (value) => value * 14)
  const gazeY = useTransform(gaze.y, (value) => value * 14)

  const glowColor = isImagine
    ? "rgba(251,146,60,0.35)"
    : "rgba(94,234,212,0.35)"

  const accentColor = isImagine ? "#FB923C" : "#5EEAD4"
  const accentColor2 = isImagine ? "#FB923C" : "#22D3EE"
  const tealColor = isImagine ? "#F97316" : "#0EA5A4"

  const animDuration = isThinking ? "2s" : isSpeaking ? "3s" : "5s"
  const breatheScale = isListening ? 1.25 : isSpeaking ? 1.1 : 1

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{ scale: breatheScale }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: "blur(30px)",
          animation: "orb-breathe 4s ease-in-out infinite",
          transform: `scale(${1 + amplitude * 0.3})`,
          transition: "transform 0.15s ease-out",
        }}
      />

      {}
      <motion.div className="absolute inset-0" style={{ x: gazeX, y: gazeY }}>
        <svg
          width={size}
          height={size}
          viewBox="-0.5 -0.5 1 1"
          style={{ overflow: "visible" }}
        >
          <defs>
            <radialGradient id="g1" cx="40%" cy="50%" r="60%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={tealColor} stopOpacity="0.3" />
            </radialGradient>
            <radialGradient id="g2" cx="60%" cy="50%" r="60%">
              <stop offset="0%" stopColor={accentColor2} stopOpacity="0.85" />
              <stop offset="100%" stopColor={tealColor} stopOpacity="0.25" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.012" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="soften">
              <feGaussianBlur stdDeviation="0.006" />
            </filter>
            {}
            <clipPath id="crescent1">
              <circle cx="0" cy="0" r="0.28" />
            </clipPath>
            <clipPath id="crescent2">
              <circle cx="0" cy="0" r="0.28" />
            </clipPath>
          </defs>

          {}
          <motion.g
            filter="url(#glow)"
            animate={reduced ? undefined : { rotate: [0, 360] }}
            transition={{
              duration: isThinking ? 20 : 60,
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ transformOrigin: "center" }}
          >
            <g transform="rotate(25)">
              {}
              <circle
                r="0.28"
                fill="url(#g1)"
                opacity="0.75"
                clipPath="url(#crescent1)"
              />
              <circle cx="0.115" r="0.21" fill="#080A0D" />
              {}
              <circle
                r="0.30"
                fill="none"
                stroke={accentColor}
                strokeWidth="0.015"
                opacity="0.3"
                filter="url(#soften)"
              />
            </g>
          </motion.g>

          {}
          <motion.g
            filter="url(#glow)"
            animate={reduced ? undefined : { rotate: [0, -360] }}
            transition={{
              duration: isThinking ? 20 : 60,
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ transformOrigin: "center" }}
          >
            <g transform="rotate(-25)">
              <circle
                r="0.28"
                fill="url(#g2)"
                opacity="0.65"
                clipPath="url(#crescent2)"
              />
              <circle cx="-0.115" r="0.21" fill="#080A0D" />
              <circle
                r="0.30"
                fill="none"
                stroke={accentColor2}
                strokeWidth="0.015"
                opacity="0.25"
                filter="url(#soften)"
              />
            </g>
          </motion.g>

          {}
          <motion.circle
            r="0.08"
            fill={accentColor}
            opacity={0.15 + amplitude * 0.15}
            filter="url(#soften)"
            animate={
              reduced ? undefined : { opacity: [0.18, 0.18, 0.04, 0.18, 0.18] }
            }
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      {}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2
        const radius = 0.38 + (i % 3) * 0.06
        const cx = Math.cos(angle) * radius
        const cy = Math.sin(angle) * radius
        const particleSize = 2 + (i % 3)
        const depth = i % 3
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: particleSize - depth * 0.5,
              height: particleSize - depth * 0.5,
              left: `${(cx + 0.5) * size}px`,
              top: `${(cy + 0.5) * size}px`,
              background: accentColor,
              opacity: 0.2 + (2 - depth) * 0.15,
              filter: `blur(${depth * 0.5}px)`,
            }}
            animate={
              reduced
                ? undefined
                : {
                    x: [0, Math.cos(angle + Math.PI * 0.3) * 4, 0],
                    y: [0, Math.sin(angle + Math.PI * 0.3) * 4, 0],
                  }
            }
            transition={{
              duration: 4 + (i % 3) * 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              delay: (i / 24) * 4,
            }}
          />
        )
      })}

      {}
      <div
        className="absolute w-full"
        style={{
          top: "95%",
          height: size * 0.3,
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${
            isImagine ? "rgba(251,146,60,0.06)" : "rgba(94,234,212,0.06)"
          } 0%, transparent 100%)`,
          filter: "blur(8px)",
          transform: "scaleY(-1)",
          opacity: 0.12,
        }}
      />
    </motion.div>
  )
}
