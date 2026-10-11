"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useSpring, useTransform } from "motion/react"
import type { AvatarExpressionState } from "@/types/mirage"
import type { GazeValues } from "@/hooks/useMousePosition"
import MirageOrb from "@/components/MirageOrb"
import { speechService } from "@/services/speechService"

interface MirageAvatarProps {
  expression: AvatarExpressionState
  amplitude?: number
  gaze: GazeValues
  size?: number
  subtitle?: string
  statusMessage?: string
  onClick?: () => void
  onExpressionChange?: (expr: AvatarExpressionState) => void
}

export default function MirageAvatar({
  expression,
  amplitude: externalAmp = 0,
  gaze,
  size = 360,
  subtitle,
  statusMessage,
  onClick,
}: MirageAvatarProps) {
  // Speech-synchronized amplitude
  const [speechAmp, setSpeechAmp] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [clickReaction, setClickReaction] = useState(false)

  // Listen to speech amplitude from speechService
  useEffect(() => {
    return speechService.subscribeAmplitude((amp) => {
      setSpeechAmp(amp)
    })
  }, [])

  // Effective audio amplitude (combines speech synthesis cadence and microphone input)
  const effectiveAmp = Math.max(externalAmp, speechAmp)

  // Smooth spring physics for head swivel & eye gaze
  const gazeX = useSpring(gaze.x, { stiffness: 85, damping: 24 })
  const gazeY = useSpring(gaze.y, { stiffness: 85, damping: 24 })

  // 3D perspective rotation transforms
  const headRotateY = useTransform(gazeX, [-1, 1], [-8, 8])
  const headRotateX = useTransform(gazeY, [-1, 1], [5, -5])
  const eyeMoveX = useTransform(gazeX, [-1, 1], [-5.5, 5.5])
  const eyeMoveY = useTransform(gazeY, [-1, 1], [-4, 4])

  // Head tilt for curious or confused states
  const headTiltZ = useMemo(() => {
    if (expression === "curious") return 5
    if (expression === "confused") return -6
    if (clickReaction) return 4
    return 0
  }, [expression, clickReaction])

  // Natural human-like random blinking (every 3 - 6 seconds)
  useEffect(() => {
    if (expression === "paused") {
      setIsBlinking(true)
      return
    }

    let timer: number
    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 3200
      timer = window.setTimeout(() => {
        setIsBlinking(true)
        window.setTimeout(() => {
          setIsBlinking(false)
          scheduleNextBlink()
        }, 150)
      }, delay)
    }

    scheduleNextBlink()
    return () => window.clearTimeout(timer)
  }, [expression])

  // State theme colors and glow palettes
  const theme = useMemo(() => {
    switch (expression) {
      case "listening":
        return {
          eyePrimary: "#5EEAD4",
          eyeSecondary: "#22D3EE",
          eyePupil: "#051A18",
          glow: "rgba(94, 234, 212, 0.45)",
          rimColor: "#5EEAD4",
          blush: "rgba(94, 234, 212, 0.2)",
          statusTag: "#5EEAD4",
        }
      case "thinking":
      case "analyzing":
        return {
          eyePrimary: "#38BDF8",
          eyeSecondary: "#60A5FA",
          eyePupil: "#071B2D",
          glow: "rgba(56, 189, 248, 0.45)",
          rimColor: "#38BDF8",
          blush: "rgba(56, 189, 248, 0.15)",
          statusTag: "#38BDF8",
        }
      case "translating":
        return {
          eyePrimary: "#C084FC",
          eyeSecondary: "#A855F7",
          eyePupil: "#1B0D2B",
          glow: "rgba(192, 132, 252, 0.4)",
          rimColor: "#C084FC",
          blush: "rgba(192, 132, 252, 0.18)",
          statusTag: "#C084FC",
        }
      case "speaking":
        return {
          eyePrimary: "#5EEAD4",
          eyeSecondary: "#22D3EE",
          eyePupil: "#041716",
          glow: "rgba(94, 234, 212, 0.55)",
          rimColor: "#5EEAD4",
          blush: "rgba(94, 234, 212, 0.25)",
          statusTag: "#5EEAD4",
        }
      case "happy":
      case "understanding":
      case "success":
        return {
          eyePrimary: "#34D399",
          eyeSecondary: "#5EEAD4",
          eyePupil: "#031B13",
          glow: "rgba(52, 211, 153, 0.5)",
          rimColor: "#34D399",
          blush: "rgba(52, 211, 153, 0.35)",
          statusTag: "#34D399",
        }
      case "curious":
        return {
          eyePrimary: "#22D3EE",
          eyeSecondary: "#38BDF8",
          eyePupil: "#041822",
          glow: "rgba(34, 211, 238, 0.5)",
          rimColor: "#22D3EE",
          blush: "rgba(34, 211, 238, 0.25)",
          statusTag: "#22D3EE",
        }
      case "confused":
      case "reassuring":
      case "low_confidence":
        return {
          eyePrimary: "#FB923C",
          eyeSecondary: "#FBBF24",
          eyePupil: "#241306",
          glow: "rgba(251, 146, 60, 0.45)",
          rimColor: "#FB923C",
          blush: "rgba(251, 146, 60, 0.2)",
          statusTag: "#FB923C",
        }
      case "executing_command":
        return {
          eyePrimary: "#FBBF24",
          eyeSecondary: "#FB923C",
          eyePupil: "#241804",
          glow: "rgba(251, 191, 36, 0.5)",
          rimColor: "#FBBF24",
          blush: "rgba(251, 191, 36, 0.2)",
          statusTag: "#FBBF24",
        }
      case "error":
        return {
          eyePrimary: "#FB7185",
          eyeSecondary: "#F43F5E",
          eyePupil: "#240910",
          glow: "rgba(251, 113, 133, 0.45)",
          rimColor: "#FB7185",
          blush: "rgba(251, 113, 133, 0.2)",
          statusTag: "#FB7185",
        }
      case "paused":
        return {
          eyePrimary: "#94A3B8",
          eyeSecondary: "#64748B",
          eyePupil: "#101620",
          glow: "rgba(148, 163, 184, 0.2)",
          rimColor: "#64748B",
          blush: "transparent",
          statusTag: "#94A3B8",
        }
      default: // idle
        return {
          eyePrimary: "#5EEAD4",
          eyeSecondary: "#22D3EE",
          eyePupil: "#051A18",
          glow: "rgba(94, 234, 212, 0.3)",
          rimColor: "#5EEAD4",
          blush: "rgba(94, 234, 212, 0.15)",
          statusTag: "#5EEAD4",
        }
    }
  }, [expression])

  // Handle click interaction: playful happy reaction
  const handleAvatarClick = () => {
    setClickReaction(true)
    setTimeout(() => setClickReaction(false), 900)
    onClick?.()
  }

  // Mouth rendering: friendly digital smile curve that articulates with speech
  const mouthComponent = useMemo(() => {
    if (expression === "speaking" && effectiveAmp > 0.08) {
      // Dynamic speech phoneme aperture
      const mouthHeight = Math.min(10, 2 + effectiveAmp * 12)
      const mouthWidth = Math.min(22, 14 + effectiveAmp * 10)
      return (
        <motion.path
          d={`M ${50 - mouthWidth / 2} 70 Q 50 ${70 + mouthHeight} ${50 + mouthWidth / 2} 70 Q 50 ${70 - mouthHeight * 0.4} ${50 - mouthWidth / 2} 70`}
          fill={theme.eyePrimary}
          fillOpacity={0.4}
          stroke={theme.eyePrimary}
          strokeWidth="1.6"
          strokeLinecap="round"
          filter="url(#digitalBloom)"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.12 }}
        />
      )
    }

    if (
      expression === "happy" ||
      expression === "understanding" ||
      expression === "success" ||
      clickReaction
    ) {
      // Warm joyful smile curve
      return (
        <path
          d="M 42 68 Q 50 76 58 68"
          fill="none"
          stroke={theme.eyePrimary}
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#digitalBloom)"
          className="transition-all duration-300"
        />
      )
    }

    if (expression === "confused") {
      // Inquisitive curved line
      return (
        <path
          d="M 43 71 Q 49 68 56 71"
          fill="none"
          stroke={theme.eyePrimary}
          strokeWidth="1.8"
          strokeLinecap="round"
          filter="url(#digitalBloom)"
          className="transition-all duration-300"
        />
      )
    }

    if (expression === "thinking" || expression === "analyzing") {
      // Concentrated subtle line
      return (
        <path
          d="M 45 69 Q 50 69 55 69"
          fill="none"
          stroke={theme.eyePrimary}
          strokeWidth="1.6"
          strokeLinecap="round"
          filter="url(#digitalBloom)"
          className="transition-all duration-300"
        />
      )
    }

    // Default friendly resting smile
    return (
      <path
        d="M 44 69 Q 50 73 56 69"
        fill="none"
        stroke={theme.eyePrimary}
        strokeWidth="1.8"
        strokeLinecap="round"
        filter="url(#digitalBloom)"
        className="transition-all duration-300"
      />
    )
  }, [expression, effectiveAmp, theme, clickReaction])

  // Eye shape rendering (Left & Right)
  const isCrescentEye =
    expression === "happy" ||
    expression === "understanding" ||
    expression === "success" ||
    clickReaction

  const isSquintRight = expression === "confused"

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none cursor-pointer"
      style={{ width: size, minHeight: size + 40 }}
      onClick={handleAvatarClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Ethereal Radial Ambient Glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 1.1,
          height: size * 1.1,
          background: `radial-gradient(circle, ${theme.glow} 0%, rgba(34,211,238,0.06) 40%, transparent 70%)`,
          filter: "blur(36px)",
        }}
        animate={{
          scale:
            expression === "speaking"
              ? [1, 1.06, 1]
              : isHovered
                ? 1.05
                : [1, 1.03, 1],
          opacity: expression === "paused" ? 0.25 : 0.9,
        }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Embedded 3D Core Orb (Beating energetic core within collar) */}
      <div
        className="absolute bottom-4 pointer-events-none opacity-85 z-0"
        style={{ transform: "scale(0.8)" }}
      >
        <MirageOrb
          state={
            expression === "listening"
              ? "listening"
              : expression === "speaking"
                ? "speaking"
                : "idle"
          }
          amplitude={effectiveAmp}
          gaze={gaze}
          size={150}
        />
      </div>

      {/* Main Companion Entity (Head Pod & Floating Ears) */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        style={{
          width: size * 0.78,
          height: size * 0.82,
          perspective: 1000,
          rotateY: headRotateY,
          rotateX: headRotateX,
          rotateZ: headTiltZ,
        }}
        animate={{
          y: clickReaction ? -8 : [0, -4, 0],
        }}
        transition={{
          y: {
            duration: clickReaction ? 0.35 : 4.5,
            repeat: clickReaction ? 0 : Infinity,
            ease: "easeInOut",
          },
        }}
      >
        {/* Floating Halo Orbit Ring */}
        <motion.div
          className="absolute -top-4 w-28 h-5 rounded-full border border-[#5EEAD4]/40 pointer-events-none"
          style={{
            boxShadow: `0 0 12px ${theme.glow}`,
            background:
              "radial-gradient(ellipse at center, rgba(94,234,212,0.15) 0%, transparent 70%)",
          }}
          animate={{
            rotateZ: [0, 360],
            scale: expression === "thinking" ? [1, 1.08, 1] : 1,
          }}
          transition={{
            rotateZ: { duration: 18, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Head Shell SVG */}
        <svg
          viewBox="0 0 100 105"
          className="w-full h-full drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft Frosted Titanium Pearlescent Shell Gradient */}
            <linearGradient
              id="companionShell"
              x1="20%"
              y1="0%"
              x2="80%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#1C2430" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#121822" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#0A0E15" stopOpacity="0.99" />
            </linearGradient>

            {/* Ambient Rim Lighting Gradient */}
            <linearGradient id="rimGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.rimColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0EA5A4" stopOpacity="0.2" />
            </linearGradient>

            {/* Deep Obsidian Curved Visor Gradient */}
            <radialGradient id="visorGlass" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#0E1622" />
              <stop offset="65%" stopColor="#06090F" />
              <stop offset="100%" stopColor="#020305" />
            </radialGradient>

            {/* Digital Eye Bloom Filter */}
            <filter
              id="digitalBloom"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Floating Cybernetic Ears / Audio Fins */}
          {/* Left Ear */}
          <g>
            <motion.path
              d="M 12 36 C 8 26, 11 16, 17 22 C 19 25, 17 38, 14 44 Z"
              fill="url(#companionShell)"
              stroke={theme.rimColor}
              strokeWidth="0.8"
              animate={{
                rotate:
                  expression === "listening"
                    ? [0, -5, 0]
                    : clickReaction
                      ? [0, -12, 0]
                      : 0,
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <circle cx="15" cy="30" r="1.4" fill={theme.eyePrimary} opacity="0.8" />
          </g>

          {/* Right Ear */}
          <g>
            <motion.path
              d="M 88 36 C 92 26, 89 16, 83 22 C 81 25, 83 38, 86 44 Z"
              fill="url(#companionShell)"
              stroke={theme.rimColor}
              strokeWidth="0.8"
              animate={{
                rotate:
                  expression === "listening"
                    ? [0, 5, 0]
                    : clickReaction
                      ? [0, 12, 0]
                      : 0,
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <circle cx="85" cy="30" r="1.4" fill={theme.eyePrimary} opacity="0.8" />
          </g>

          {/* Smooth Pebble Outer Pod Head */}
          <path
            d="M 20 48 C 20 22, 34 10, 50 10 C 66 10, 80 22, 80 48 C 80 74, 68 88, 50 88 C 32 88, 20 74, 20 48 Z"
            fill="url(#companionShell)"
            stroke="url(#rimGlow)"
            strokeWidth="1.2"
          />

          {/* Soft Curved Obsidian Glass Visor Screen */}
          <path
            d="M 25 48 C 25 28, 36 20, 50 20 C 64 20, 75 28, 75 48 C 75 68, 65 79, 50 79 C 35 79, 25 68, 25 48 Z"
            fill="url(#visorGlass)"
            stroke={theme.rimColor}
            strokeWidth="0.6"
            strokeOpacity="0.4"
          />

          {/* Curved Visor Specular Glass Arc (Upper Rim Reflection) */}
          <path
            d="M 30 32 C 38 24, 62 24, 70 32"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Cheeks Glow / Blush (On Happy, Understanding, Success) */}
          <circle cx="33" cy="58" r="3.5" fill={theme.blush} filter="url(#digitalBloom)" />
          <circle cx="67" cy="58" r="3.5" fill={theme.blush} filter="url(#digitalBloom)" />

          {/* LEFT DIGITAL EYE */}
          <g>
            {isBlinking ? (
              // Blinking: Soft resting luminous line
              <line
                x1="33"
                y1="46"
                x2="45"
                y2="46"
                stroke={theme.eyePrimary}
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="url(#digitalBloom)"
              />
            ) : isCrescentEye ? (
              // Joyful Crescent Smile Eye (⌒)
              <path
                d="M 33 48 Q 39 40 45 48"
                fill="none"
                stroke={theme.eyePrimary}
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#digitalBloom)"
                className="transition-all duration-300"
              />
            ) : (
              // Open Digital Capsule Eye with Gaze-Tracking Pupil & Specular Sparkles
              <g>
                {/* Luminous Capsule Sclera / Outer Eye */}
                <rect
                  x="33"
                  y="38"
                  width="13"
                  height="16"
                  rx="6.5"
                  fill={theme.eyePrimary}
                  filter="url(#digitalBloom)"
                  opacity="0.95"
                />

                {/* Gaze-Tracking Pupil Core */}
                <motion.g style={{ x: eyeMoveX, y: eyeMoveY }}>
                  <ellipse
                    cx="39.5"
                    cy="46"
                    rx="4.2"
                    ry="5.2"
                    fill={theme.eyePupil}
                  />

                  {/* Primary Bright Specular Highlight */}
                  <circle
                    cx="37.8"
                    cy="43.2"
                    r="1.6"
                    fill="#FFFFFF"
                    opacity="0.95"
                  />

                  {/* Secondary Cute Twinkle Dot */}
                  <circle
                    cx="41.2"
                    cy="47.8"
                    r="0.8"
                    fill="#FFFFFF"
                    opacity="0.85"
                  />
                </motion.g>

                {/* Thinking Iris Reticle Scan Overlay */}
                {(expression === "thinking" || expression === "analyzing") && (
                  <motion.circle
                    cx="39.5"
                    cy="46"
                    r="5.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </g>
            )}
          </g>

          {/* RIGHT DIGITAL EYE */}
          <g>
            {isBlinking ? (
              // Blinking: Soft resting luminous line
              <line
                x1="55"
                y1="46"
                x2="67"
                y2="46"
                stroke={theme.eyePrimary}
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="url(#digitalBloom)"
              />
            ) : isCrescentEye ? (
              // Joyful Crescent Smile Eye (⌒)
              <path
                d="M 55 48 Q 61 40 67 48"
                fill="none"
                stroke={theme.eyePrimary}
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#digitalBloom)"
                className="transition-all duration-300"
              />
            ) : isSquintRight ? (
              // Confused Asymmetric Slight Squint
              <g>
                <rect
                  x="55"
                  y="41"
                  width="13"
                  height="11"
                  rx="5.5"
                  fill={theme.eyePrimary}
                  filter="url(#digitalBloom)"
                />
                <circle cx="61.5" cy="46.5" r="3.2" fill={theme.eyePupil} />
                <circle cx="60.2" cy="44.8" r="1.2" fill="#FFFFFF" opacity="0.9" />
              </g>
            ) : (
              // Open Digital Capsule Eye with Gaze-Tracking Pupil & Specular Sparkles
              <g>
                {/* Luminous Capsule Sclera / Outer Eye */}
                <rect
                  x="55"
                  y="38"
                  width="13"
                  height="16"
                  rx="6.5"
                  fill={theme.eyePrimary}
                  filter="url(#digitalBloom)"
                  opacity="0.95"
                />

                {/* Gaze-Tracking Pupil Core */}
                <motion.g style={{ x: eyeMoveX, y: eyeMoveY }}>
                  <ellipse
                    cx="61.5"
                    cy="46"
                    rx="4.2"
                    ry="5.2"
                    fill={theme.eyePupil}
                  />

                  {/* Primary Bright Specular Highlight */}
                  <circle
                    cx="59.8"
                    cy="43.2"
                    r="1.6"
                    fill="#FFFFFF"
                    opacity="0.95"
                  />

                  {/* Secondary Cute Twinkle Dot */}
                  <circle
                    cx="63.2"
                    cy="47.8"
                    r="0.8"
                    fill="#FFFFFF"
                    opacity="0.85"
                  />
                </motion.g>

                {/* Thinking Iris Reticle Scan Overlay */}
                {(expression === "thinking" || expression === "analyzing") && (
                  <motion.circle
                    cx="61.5"
                    cy="46"
                    r="5.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </g>
            )}
          </g>

          {/* Subtly Animated Eyebrows (Floating Clean Micro-Arcs) */}
          <path
            d={
              expression === "confused"
                ? "M 34 32 Q 39 34 44 35"
                : expression === "curious" || expression === "listening"
                  ? "M 34 30 Q 39 29 44 31"
                  : "M 34 32 Q 39 31 44 33"
            }
            fill="none"
            stroke={theme.eyePrimary}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d={
              expression === "confused"
                ? "M 56 31 Q 61 29 66 30"
                : expression === "curious" || expression === "listening"
                  ? "M 56 30 Q 61 29 66 31"
                  : "M 56 33 Q 61 31 66 32"
            }
            fill="none"
            stroke={theme.eyePrimary}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Friendly Digital Mouth */}
          {mouthComponent}

          {/* Floating Lower Collar / Chest Pod */}
          <path
            d="M 38 88 C 38 84, 62 84, 62 88 C 68 93, 72 99, 72 104 L 28 104 C 28 99, 32 93, 38 88 Z"
            fill="url(#companionShell)"
            stroke={theme.rimColor}
            strokeWidth="0.8"
            opacity="0.9"
          />
        </svg>

        {/* Audio Visualizer Waves (Expanding smoothly when speaking) */}
        {expression === "speaking" && effectiveAmp > 0.05 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-[#5EEAD4]/40"
                style={{
                  width: 130 + i * 40,
                  height: 130 + i * 40,
                }}
                initial={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: [0.85, 1.45], opacity: [0.5, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.7,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Subtitles / Spoken Speech Subtitle Bubble */}
      {subtitle && (
        <motion.div
          className="relative z-20 mt-3 max-w-sm px-4 py-2 rounded-2xl glass text-center border border-white/10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-xs text-white/90 font-light leading-relaxed tracking-wide">
            {subtitle}
          </p>
        </motion.div>
      )}

      {/* Status Message Tag */}
      {statusMessage && (
        <div className="relative z-20 mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: theme.statusTag }}
          />
          <span className="text-[11px] font-mono tracking-wider text-white/70">
            {statusMessage}
          </span>
        </div>
      )}
    </div>
  )
}
