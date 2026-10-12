"use client"

/**
 * MIRAGE AI — Luminous Companion Avatar (Full Body)
 *
 * Premium AI companion with expressive face, cute body, animated arms,
 * multi-layer speech mouth, and processing dots.
 *
 * Architecture:
 *  - Face/eyes: PRESERVED from previous iteration (do not modify)
 *  - Speech mouth: MotionValue → useTransform → multi-layer scaling (zero re-renders)
 *  - Breathing: Framer Motion animate (zero re-renders)
 *  - Blink: useState + setTimeout (~3 re-renders / 4s)
 *  - Arms: Framer Motion springs per expression (auto-transition)
 *  - Processing dots: conditional HTML elements
 */

/* ─── Props ─── */

/* ─── Face Layout (unchanged) ─── */

/* ─── Body Layout ─── */

/* ─── Arm Poses (rotation degrees per state) ─── */

/* ─── Component ─── */

// ── Blink ──

// ── Speech amplitude (MotionValue — zero re-renders) ──

// Non-linear mapping: natural variety in mouth opening
// Lip contour scales less aggressively for definition

// ── Gaze springs ──

// Click

// Derived flags

/* ═══════════════════════════════════════════════════════
 *  renderEye — PRESERVED EXACTLY (do not modify)
 * ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
 *  renderMouth — IMPROVED multi-layer speaking animation
 * ═══════════════════════════════════════════════════════ */ /* Lip contour — scales less aggressively for definition */ /* Inner dark mouth — visible at wider openings for depth */ /* Main mouth opening */

// Static mouth shapes (non-speaking)

/* ═══════════════════════════════════════════════════════
 *  renderBrows — PRESERVED EXACTLY
 * ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
 *  renderBody — NEW: torso, arms, hands
 * ═══════════════════════════════════════════════════════ */ /* ── Torso ── */ /* Torso inner glow */ /* Chest power indicator */ /* Shoulder joint accents */ /* ── Left Arm ── */ /* Elbow joint */ /* Hand */ /* Hand highlight */ /* ── Right Arm ── */ /* Elbow joint */ /* Hand */ /* Hand highlight */

/* ═══════════════════════════════════════════════════════
 *  Render
 * ═══════════════════════════════════════════════════════ */ /* ── Ambient aura glow ── */ /* ── Character container (perspective, breathing, tilt) ── */ /* Head shell — layered dark gradient */ /* Inner luminous zone */ /* Rim light */ /* Top specular */ /* Filters */ /* ═══════════════════════════════════
 *  BODY (rendered BEHIND the head)
 * ═══════════════════════════════════ */ /* ═══════════════════════════════════
 *  HEAD SHELL — PRESERVED EXACTLY
 * ═══════════════════════════════════ */ /* ═══ EYEBROWS — PRESERVED ═══ */ /* ═══ EYES — PRESERVED ═══ */ /* ═══ MOUTH — IMPROVED ═══ */ /* Chin accent — PRESERVED */ /* ── Processing dots (thinking/analyzing) ── */ /* ── Subtitle bubble ── */ /* ── Status message ── */

import { useMemo, useState, useCallback } from "react"
import { motion, useSpring, useTransform } from "motion/react"
import type { AvatarExpressionState } from "@/types/mirage"
import type { GazeValues } from "@/hooks/useMousePosition"
import { getStateConfig } from "./AvatarStateMachine"
import { useSpeechAmplitude } from "./AvatarSpeechSync"
import { useBlinkController } from "./AvatarAnimationController"

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

const EYE_Y = 96
const EYE_L = 72
const EYE_R = 128
const EYE_W = 28
const EYE_H = 32
const PUPIL_RX = 7
const PUPIL_RY = 8.5
const MOUTH_Y = 146

const SHOULDER_Y = 192
const SHOULDER_L = 68
const SHOULDER_R = 132

interface ArmPose {
  left: number
  right: number
}

const ARM_POSES: Record<string, ArmPose> = {
  idle: { left: 5, right: -5 },
  observing: { left: -4, right: 4 },
  listening: { left: -8, right: 8 },
  thinking: { left: 3, right: -22 },
  analyzing: { left: 3, right: -22 },
  sign_detected: { left: -10, right: 10 },
  translating: { left: -5, right: 5 },
  speaking: { left: 5, right: -5 },
  understanding: { left: -12, right: 12 },
  happy: { left: -22, right: 22 },
  curious: { left: 3, right: -14 },
  confused: { left: -6, right: 6 },
  reassuring: { left: -8, right: 8 },
  low_confidence: { left: 4, right: -4 },
  executing_command: { left: 2, right: -2 },
  success: { left: -28, right: 28 },
  error: { left: 3, right: -3 },
  paused: { left: 2, right: -2 },
}

const PROCESSING_STATES = new Set<AvatarExpressionState>([
  "thinking",
  "analyzing",
  "translating",
  "executing_command",
])

export default function MirageAvatar({
  expression,
  amplitude: _externalAmp = 0,
  gaze,
  size = 360,
  subtitle,
  statusMessage,
  onClick,
}: MirageAvatarProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [clickReaction, setClickReaction] = useState(false)

  const config = useMemo(() => getStateConfig(expression), [expression])
  const c = config.colors
  const blink = useBlinkController(expression)
  const speechAmp = useSpeechAmplitude()
  const mouthScaleY = useTransform(
    speechAmp,
    [0, 0.06, 0.15, 0.3, 0.5, 0.7],
    [0.04, 0.18, 0.4, 0.62, 0.82, 1.0],
  )
  const mouthScaleX = useTransform(
    speechAmp,
    [0, 0.1, 0.3, 0.7],
    [0.6, 0.72, 0.86, 1.0],
  )
  const innerMouthOpacity = useTransform(speechAmp, [0.12, 0.35], [0, 0.55])
  const lipScaleY = useTransform(mouthScaleY, [0, 1], [0.3, 1.08])
  const lipScaleX = useTransform(mouthScaleX, [0, 1], [0.85, 1.06])
  const gazeX = useSpring(gaze.x, { stiffness: 80, damping: 22 })
  const gazeY = useSpring(gaze.y, { stiffness: 80, damping: 22 })
  const eyeOffsetX = useTransform(gazeX, [-1, 1], [-5.5, 5.5])
  const eyeOffsetY = useTransform(gazeY, [-1, 1], [-3.5, 3.5])
  const headRotY = useTransform(gazeX, [-1, 1], [-5, 5])
  const headRotX = useTransform(gazeY, [-1, 1], [3, -3])
  const handleClick = useCallback(() => {
    setClickReaction(true)
    setTimeout(() => setClickReaction(false), 650)
    onClick?.()
  }, [onClick])
  const headTiltZ = clickReaction ? 3.5 : config.headTiltZ
  const isCrescent =
    config.eyeShape ===
      "crescent" ||
    clickReaction
  const isClosed =
    config.eyeShape ===
    "closed"
  const isSpeaking =
    expression ===
    "speaking"
  const isThinking =
    expression ===
      "thinking" ||
    expression ===
      "analyzing"
  const isProcessing = PROCESSING_STATES.has(expression)

  const armPose =
    ARM_POSES[expression] ??
    ARM_POSES.idle
  const armSpring = { type: "spring" as const, stiffness: 55, damping: 14 }
  const renderEye = (cx: number, side: "left" | "right") => {
    const closed =
      side ===
      "left"
        ? blink.left
        : blink.right
    const isSquint =
      side ===
        "right" &&
      config.rightEyeShape ===
        "squint"

    let h = EYE_H
    let w = EYE_W
    if (
      config.eyeShape ===
      "wide"
    ) {
      h = 36
      w = 30
    }
    if (
      config.eyeShape ===
        "narrow" ||
      isSquint
    ) {
      h = 24
      w = 26
    }

    const rx =
      w /
      2
    const ry =
      h /
      2

    if (closed || isClosed) {
      return (
        <line
          x1={
            cx -
            rx
          }
          y1={EYE_Y}
          x2={
            cx +
            rx
          }
          y2={EYE_Y}
          stroke={c.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#fGlow)"
          className="transition-[stroke] duration-500"
        />
      )
    }

    if (isCrescent) {
      return (
        <path
          d={`M ${cx - rx + 2} ${
            EYE_Y +
            3
          } Q ${cx} ${
            EYE_Y -
            13
          } ${cx + rx - 2} ${
            EYE_Y +
            3
          }`}
          fill="none"
          stroke={c.primary}
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#fGlow)"
          className="transition-[stroke] duration-500"
        />
      )
    }

    return (
      <g>
        <rect
          x={
            cx -
            rx
          }
          y={
            EYE_Y -
            ry
          }
          width={w}
          height={h}
          rx={rx}
          fill={c.iris}
          filter="url(#fGlow)"
          opacity={0.9}
          className="transition-[fill] duration-500"
        />
        <rect
          x={cx - rx + 3}
          y={EYE_Y - ry + 3}
          width={
            w -
            6
          }
          height={
            h -
            6
          }
          rx={
            rx -
            3
          }
          fill="none"
          stroke={c.secondary}
          strokeWidth="1"
          opacity={0.35}
          className="transition-[stroke] duration-500"
        />
        <motion.g style={{ x: eyeOffsetX, y: eyeOffsetY }}>
          <ellipse
            cx={cx}
            cy={EYE_Y}
            rx={
              PUPIL_RX *
              config.pupilScale
            }
            ry={
              PUPIL_RY *
              config.pupilScale
            }
            fill={c.pupil}
            className="transition-[fill] duration-500"
          />
          <circle
            cx={
              cx -
              2.2
            }
            cy={
              EYE_Y -
              3.8
            }
            r={2}
            fill="#FFF"
            opacity={0.92}
          />
          <circle
            cx={
              cx +
              2.5
            }
            cy={
              EYE_Y +
              3
            }
            r={1}
            fill="#FFF"
            opacity={0.72}
          />
          <circle
            cx={
              cx -
              0.5
            }
            cy={
              EYE_Y -
              6
            }
            r={0.6}
            fill="#FFF"
            opacity={0.5}
          />
        </motion.g>
        {isThinking && (
          <motion.circle
            cx={cx}
            cy={EYE_Y}
            r={
              rx -
              2
            }
            fill="none"
            stroke="#FFF"
            strokeWidth="0.4"
            strokeDasharray="2.5 3"
            opacity={0.3}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${EYE_Y}px` }}
          />
        )}
      </g>
    )
  }
  const renderMouth = () => {
    if (isSpeaking) {
      return (
        <g>
          {}
          <motion.g
            style={{
              scaleY: lipScaleY,
              scaleX: lipScaleX,
              transformOrigin: `100px ${MOUTH_Y}px`,
            }}
          >
            <ellipse
              cx={100}
              cy={MOUTH_Y}
              rx={11}
              ry={6}
              fill="none"
              stroke={c.primary}
              strokeWidth="0.7"
              opacity={0.35}
              filter="url(#fMouth)"
              className="transition-[stroke] duration-500"
            />
          </motion.g>

          {}
          <motion.g
            style={{
              scaleY: mouthScaleY,
              scaleX: mouthScaleX,
              transformOrigin: `100px ${MOUTH_Y}px`,
            }}
          >
            <motion.ellipse
              cx={100}
              cy={MOUTH_Y}
              rx={6}
              ry={3.5}
              fill={c.pupil}
              style={{ opacity: innerMouthOpacity }}
            />
          </motion.g>

          {}
          <motion.g
            style={{
              scaleY: mouthScaleY,
              scaleX: mouthScaleX,
              transformOrigin: `100px ${MOUTH_Y}px`,
            }}
          >
            <ellipse
              cx={100}
              cy={MOUTH_Y}
              rx={9}
              ry={5}
              fill={c.primary}
              fillOpacity={0.22}
              stroke={c.primary}
              strokeWidth="1.4"
              filter="url(#fMouth)"
              className="transition-[fill,stroke] duration-500"
            />
          </motion.g>
        </g>
      )
    }
    let d: string
    let sw = "1.8"
    let opacity = 1

    switch (config.mouthCurve) {
      case "wide-smile":
        d = `M 88 ${MOUTH_Y} Q 100 ${MOUTH_Y + 10} 112 ${MOUTH_Y}`
        sw = "2.2"
        break
      case "slight-frown":
        d = `M 91 ${MOUTH_Y + 1} Q 98 ${MOUTH_Y - 3} 109 ${MOUTH_Y}`
        break
      case "neutral":
      case "flat":
        d = `M 92 ${MOUTH_Y} L 108 ${MOUTH_Y}`
        sw = "1.4"
        opacity = 0.6
        break
      default:
        d = `M 90 ${MOUTH_Y} Q 100 ${MOUTH_Y + 7} 110 ${MOUTH_Y}`
        break
    }

    return (
      <path
        d={d}
        fill="none"
        stroke={c.primary}
        strokeWidth={sw}
        strokeLinecap="round"
        filter="url(#fMouth)"
        opacity={opacity}
        className="transition-all duration-500"
      />
    )
  }
  const renderBrows = () => {
    const by = EYE_Y - 25
    const o = 0.45

    let lD = `M ${EYE_L - 12} ${by + 1} Q ${EYE_L} ${by} ${EYE_L + 12} ${by + 1}`
    let rD = `M ${EYE_R - 12} ${by + 1} Q ${EYE_R} ${by} ${EYE_R + 12} ${by + 1}`

    if (expression === "confused") {
      lD = `M ${EYE_L - 11} ${by + 2} Q ${EYE_L} ${by - 1} ${EYE_L + 11} ${by}`
      rD = `M ${EYE_R - 11} ${by - 1} Q ${EYE_R} ${by + 2} ${EYE_R + 11} ${by + 3}`
    } else if (expression === "curious" || expression === "listening") {
      lD = `M ${EYE_L - 12} ${by + 2} Q ${EYE_L} ${by - 2} ${EYE_L + 12} ${by + 1}`
      rD = `M ${EYE_R - 12} ${by + 1} Q ${EYE_R} ${by - 2} ${EYE_R + 12} ${by + 2}`
    } else if (isThinking) {
      lD = `M ${EYE_L - 11} ${by} Q ${EYE_L} ${by + 2} ${EYE_L + 11} ${by + 2}`
      rD = `M ${EYE_R - 11} ${by + 2} Q ${EYE_R} ${by + 2} ${EYE_R + 11} ${by}`
    }

    return (
      <>
        <path
          d={lD}
          fill="none"
          stroke={c.primary}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={o}
          className="transition-all duration-500"
        />
        <path
          d={rD}
          fill="none"
          stroke={c.primary}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={o}
          className="transition-all duration-500"
        />
      </>
    )
  }
  const renderBody = () => {
    return (
      <g>
        {}
        <path
          d="M 78 182 C 78 176, 122 176, 122 182 L 126 222 C 126 240, 74 240, 74 222 Z"
          fill="url(#gShell)"
          stroke="url(#gRim)"
          strokeWidth="0.9"
          className="transition-[stroke] duration-700"
        />

        {}
        <path
          d="M 82 186 C 82 182, 118 182, 118 186 L 121 218 C 121 233, 79 233, 79 218 Z"
          fill="url(#gInner)"
          opacity={0.6}
        />

        {}
        <circle
          cx={100}
          cy={208}
          r={3.5}
          fill={c.primary}
          opacity={0.28}
          filter="url(#fGlow)"
          className="transition-[fill] duration-700"
        />
        <circle
          cx={100}
          cy={208}
          r={6}
          fill="none"
          stroke={c.primary}
          strokeWidth="0.4"
          opacity={0.12}
          className="transition-[stroke] duration-700"
        />

        {}
        <circle
          cx={SHOULDER_L}
          cy={SHOULDER_Y}
          r={4}
          fill="url(#gShell)"
          stroke={c.primary}
          strokeWidth="0.5"
          opacity={0.5}
          className="transition-[stroke] duration-500"
        />
        <circle
          cx={SHOULDER_R}
          cy={SHOULDER_Y}
          r={4}
          fill="url(#gShell)"
          stroke={c.primary}
          strokeWidth="0.5"
          opacity={0.5}
          className="transition-[stroke] duration-500"
        />

        {}
        <motion.g
          animate={
            isSpeaking
              ? { rotate: [3, -6, 5, -4, 3] }
              : expression === "idle"
                ? {
                    rotate: [
                      armPose.left,
                      armPose.left - 2,
                      armPose.left + 1,
                      armPose.left,
                    ],
                  }
                : { rotate: armPose.left }
          }
          transition={
            isSpeaking
              ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
              : expression === "idle"
                ? { duration: 7, repeat: Infinity, ease: "easeInOut" }
                : armSpring
          }
          style={{ transformOrigin: `${SHOULDER_L}px ${SHOULDER_Y}px` }}
        >
          <path
            d={`M ${SHOULDER_L} ${SHOULDER_Y} C ${SHOULDER_L - 14} ${SHOULDER_Y + 8}, ${SHOULDER_L - 20} ${SHOULDER_Y + 22}, ${SHOULDER_L - 18} ${SHOULDER_Y + 36}`}
            fill="none"
            stroke="url(#gRim)"
            strokeWidth="5.5"
            strokeLinecap="round"
            className="transition-[stroke] duration-500"
          />
          {}
          <circle
            cx={SHOULDER_L - 16}
            cy={SHOULDER_Y + 18}
            r={2.5}
            fill="#1A1F2A"
            stroke={c.primary}
            strokeWidth="0.4"
            opacity={0.5}
            className="transition-[stroke] duration-500"
          />
          {}
          <circle
            cx={SHOULDER_L - 18}
            cy={SHOULDER_Y + 36}
            r={5.5}
            fill="#1A1F2A"
            stroke={c.primary}
            strokeWidth="0.6"
            opacity={0.8}
            className="transition-[stroke,fill] duration-500"
          />
          {}
          <circle
            cx={SHOULDER_L - 19.5}
            cy={SHOULDER_Y + 34}
            r={1.2}
            fill="#FFF"
            opacity={0.15}
          />
        </motion.g>

        {}
        <motion.g
          animate={
            isSpeaking
              ? { rotate: [-4, 5, -3, 6, -4] }
              : expression === "idle"
                ? {
                    rotate: [
                      armPose.right,
                      armPose.right + 2,
                      armPose.right - 1,
                      armPose.right,
                    ],
                  }
                : { rotate: armPose.right }
          }
          transition={
            isSpeaking
              ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
              : expression === "idle"
                ? { duration: 8, repeat: Infinity, ease: "easeInOut" }
                : armSpring
          }
          style={{ transformOrigin: `${SHOULDER_R}px ${SHOULDER_Y}px` }}
        >
          <path
            d={`M ${SHOULDER_R} ${SHOULDER_Y} C ${SHOULDER_R + 14} ${SHOULDER_Y + 8}, ${SHOULDER_R + 20} ${SHOULDER_Y + 22}, ${SHOULDER_R + 18} ${SHOULDER_Y + 36}`}
            fill="none"
            stroke="url(#gRim)"
            strokeWidth="5.5"
            strokeLinecap="round"
            className="transition-[stroke] duration-500"
          />
          {}
          <circle
            cx={SHOULDER_R + 16}
            cy={SHOULDER_Y + 18}
            r={2.5}
            fill="#1A1F2A"
            stroke={c.primary}
            strokeWidth="0.4"
            opacity={0.5}
            className="transition-[stroke] duration-500"
          />
          {}
          <circle
            cx={SHOULDER_R + 18}
            cy={SHOULDER_Y + 36}
            r={5.5}
            fill="#1A1F2A"
            stroke={c.primary}
            strokeWidth="0.6"
            opacity={0.8}
            className="transition-[stroke,fill] duration-500"
          />
          {}
          <circle
            cx={SHOULDER_R + 19.5}
            cy={SHOULDER_Y + 34}
            r={1.2}
            fill="#FFF"
            opacity={0.15}
          />
        </motion.g>
      </g>
    )
  }
  return (
    <div
      className="relative flex flex-col items-center justify-center select-none cursor-pointer"
      style={{ width: size, minHeight: size + 60 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 1.1,
          height: size * 1.1,
          top: "5%",
          background: `radial-gradient(circle, ${c.glow} 0%, transparent 68%)`,
          filter: "blur(44px)",
        }}
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : isHovered ? 1.05 : [1, 1.03, 1],
          opacity: expression === "paused" ? 0.15 : config.glowIntensity * 2.2,
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        style={{
          width: size * 0.72,
          height: size * 1.02,
          perspective: 1200,
          rotateY: headRotY,
          rotateX: headRotX,
          rotateZ: headTiltZ,
        }}
        animate={{
          y: clickReaction ? [0, -8, 0] : [0, -config.breathAmplitude, 0],
        }}
        transition={{
          y: clickReaction
            ? { duration: 0.4, ease: "easeOut" }
            : {
                duration: config.breathPeriod,
                repeat: Infinity,
                ease: "easeInOut",
              },
        }}
      >
        <svg
          viewBox="0 0 200 280"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 10px 36px rgba(0,0,0,0.55))" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {}
            <radialGradient id="gShell" cx="50%" cy="36%" r="68%">
              <stop offset="0%" stopColor="#222838" />
              <stop offset="55%" stopColor="#181D28" />
              <stop offset="100%" stopColor="#10131A" />
            </radialGradient>

            {}
            <radialGradient id="gInner" cx="50%" cy="40%" r="52%">
              <stop offset="0%" stopColor={c.primary} stopOpacity="0.06" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {}
            <linearGradient id="gRim" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor={c.primary} stopOpacity="0.55" />
              <stop offset="35%" stopColor={c.secondary} stopOpacity="0.25" />
              <stop offset="65%" stopColor={c.primary} stopOpacity="0.12" />
              <stop offset="100%" stopColor={c.secondary} stopOpacity="0.45" />
            </linearGradient>

            {}
            <radialGradient id="gSpec" cx="50%" cy="18%" r="35%">
              <stop offset="0%" stopColor="#FFF" stopOpacity="0.055" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {}
            <filter id="fGlow" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="1.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="fMouth" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="1" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {}
          {renderBody()}

          {}
          <path
            d="M 100 28 C 156 28, 176 65, 176 104 C 176 145, 158 180, 100 184 C 42 180, 24 145, 24 104 C 24 65, 44 28, 100 28 Z"
            fill="url(#gShell)"
            stroke="url(#gRim)"
            strokeWidth="1.2"
            className="transition-[stroke] duration-700"
          />
          <path
            d="M 100 40 C 148 40, 164 70, 164 104 C 164 138, 150 170, 100 174 C 50 170, 36 138, 36 104 C 36 70, 52 40, 100 40 Z"
            fill="url(#gInner)"
            className="transition-all duration-700"
          />
          <path
            d="M 58 50 Q 100 36 142 50"
            fill="none"
            stroke="#FFF"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity={0.15}
          />
          <ellipse cx={100} cy={55} rx={46} ry={20} fill="url(#gSpec)" />

          <line
            x1={38}
            y1={90}
            x2={38}
            y2={104}
            stroke={c.primary}
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity={0.18}
            className="transition-[stroke] duration-700"
          />
          <line
            x1={162}
            y1={90}
            x2={162}
            y2={104}
            stroke={c.primary}
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity={0.18}
            className="transition-[stroke] duration-700"
          />

          <circle
            cx={100}
            cy={48}
            r={2.2}
            fill={c.primary}
            opacity={0.55}
            filter="url(#fGlow)"
            className="transition-[fill] duration-700"
          />
          <circle
            cx={100}
            cy={48}
            r={4.5}
            fill="none"
            stroke={c.primary}
            strokeWidth="0.4"
            opacity={0.2}
            className="transition-[stroke] duration-700"
          />

          <circle
            cx={EYE_L - 6}
            cy={EYE_Y + 22}
            r={9}
            fill={c.blush}
            filter="url(#fSoft)"
            className="transition-[fill] duration-500"
          />
          <circle
            cx={EYE_R + 6}
            cy={EYE_Y + 22}
            r={9}
            fill={c.blush}
            filter="url(#fSoft)"
            className="transition-[fill] duration-500"
          />

          {}
          {renderBrows()}

          {}
          {renderEye(EYE_L, "left")}
          {renderEye(EYE_R, "right")}

          {}
          {renderMouth()}

          {}
          <path
            d="M 82 155 Q 100 162 118 155"
            fill="none"
            stroke={c.primary}
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity={0.15}
            className="transition-[stroke] duration-700"
          />
        </svg>
      </motion.div>

      {}
      {isProcessing && (
        <div className="relative z-10 flex gap-2 -mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: c.primary }}
              animate={{
                y: [0, -5, 0],
                opacity: [0.35, 1, 0.35],
              }}
              transition={{
                duration: 0.72,
                delay: i * 0.14,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {}
      {subtitle && (
        <motion.div
          className="relative z-20 mt-3 max-w-sm px-4 py-2 rounded-2xl glass text-center border border-white/10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-white/90 font-light leading-relaxed tracking-wide">
            {subtitle}
          </p>
        </motion.div>
      )}

      {}
      {statusMessage && (
        <div className="relative z-20 mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: c.primary }}
          />
          <span className="text-[11px] font-mono tracking-wider text-white/70">
            {statusMessage}
          </span>
        </div>
      )}
    </div>
  )
}
