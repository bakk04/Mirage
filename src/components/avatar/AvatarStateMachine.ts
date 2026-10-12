/**
 * MIRAGE AI — Avatar State Machine
 *
 * Single source of truth for every expression state's visual parameters.
 * Colors use the MIRAGE brand palette: teal #3DDBB5, orange #F5A25D.
 */

import type { AvatarExpressionState } from "@/types/mirage"

export type EyeShape = "default" | "crescent" | "wide" | "narrow" | "squint" | "closed" // Rounded capsule, relaxed // Happy arc ⌒ // Slightly taller, attentive // Concentrated // Asymmetric (confused) // Paused / sleeping

export type MouthCurve = "smile" | "wide-smile" | "neutral" | "open" | "slight-frown" | "flat" // Gentle upward arc // Larger happy arc // Nearly flat line // Speaking — driven by amplitude // Gentle questioning downturn // Composed, minimal

export interface AvatarStateConfig {
  eyeShape: EyeShape
  rightEyeShape?: EyeShape
  pupilScale: number
  mouthCurve: MouthCurve
  glowIntensity: number
  headTiltZ: number
  breathAmplitude: number // px
  breathPeriod: number // seconds
  blinkRange: [number, number] // [min, max] ms
  transitionMs: number
  colors: StateColors
}

export interface StateColors {
  primary: string
  secondary: string
  glow: string
  iris: string
  pupil: string
  blush: string
}

/* ─── Brand-aligned Color Palettes ─── */

const P = {
  teal: {
    primary: "#3DDBB5",
    secondary: "#2EC4A0",
    glow: "rgba(61, 219, 181, 0.28)",
    iris: "#3DDBB5",
    pupil: "#081324",
    blush: "rgba(61, 219, 181, 0.12)",
  },
  tealActive: {
    primary: "#3DDBB5",
    secondary: "#2EC4A0",
    glow: "rgba(61, 219, 181, 0.45)",
    iris: "#3DDBB5",
    pupil: "#081324",
    blush: "rgba(61, 219, 181, 0.18)",
  },
  speaking: {
    primary: "#3DDBB5",
    secondary: "#2EC4A0",
    glow: "rgba(61, 219, 181, 0.45)",
    iris: "#3DDBB5",
    pupil: "#081324",
    blush: "rgba(61, 219, 181, 0.20)",
  },
  blue: {
    primary: "#3DDBB5",
    secondary: "#2EC4A0",
    glow: "rgba(61, 219, 181, 0.28)",
    iris: "#3DDBB5",
    pupil: "#0A1525",
    blush: "rgba(61, 219, 181, 0.10)",
  },
  green: {
    primary: "#4ADE80",
    secondary: "#3DDBB5",
    glow: "rgba(74, 222, 128, 0.36)",
    iris: "#4ADE80",
    pupil: "#082012",
    blush: "rgba(74, 222, 128, 0.20)",
  },
  cyan: {
    primary: "#3DDBB5",
    secondary: "#2EC4A0",
    glow: "rgba(61, 219, 181, 0.30)",
    iris: "#3DDBB5",
    pupil: "#081820",
    blush: "rgba(61, 219, 181, 0.14)",
  },
  orange: {
    primary: "#F5A25D",
    secondary: "#F5C278",
    glow: "rgba(245, 162, 93, 0.26)",
    iris: "#F5A25D",
    pupil: "#201208",
    blush: "rgba(245, 162, 93, 0.12)",
  },
  rose: {
    primary: "#E87171",
    secondary: "#F5A25D",
    glow: "rgba(232, 113, 113, 0.24)",
    iris: "#E87171",
    pupil: "#200A0A",
    blush: "rgba(232, 113, 113, 0.10)",
  },
  purple: {
    primary: "#A78BFA",
    secondary: "#C4B5FD",
    glow: "rgba(167, 139, 250, 0.26)",
    iris: "#A78BFA",
    pupil: "#140D25",
    blush: "rgba(167, 139, 250, 0.10)",
  },
  command: {
    primary: "#FBBF24",
    secondary: "#F5A25D",
    glow: "rgba(251, 191, 36, 0.28)",
    iris: "#FBBF24",
    pupil: "#201805",
    blush: "rgba(251, 191, 36, 0.10)",
  },
  slate: {
    primary: "#8896A7",
    secondary: "#6B7A8D",
    glow: "rgba(136, 150, 167, 0.10)",
    iris: "#8896A7",
    pupil: "#101520",
    blush: "transparent",
  },
} as const

/* ─── State Configurations ─── */

const D: Omit<AvatarStateConfig, "colors"> = {
  eyeShape: "default",
  pupilScale: 1.0,
  mouthCurve: "smile",
  glowIntensity: 0.22,
  headTiltZ: 0,
  breathAmplitude: 2.5,
  breathPeriod: 5,
  blinkRange: [3200, 6000],
  transitionMs: 500,
}

const CONFIGS: Record<AvatarExpressionState, AvatarStateConfig> = {
  idle: { ...D, colors: P.teal },

  observing: {
    ...D,
    eyeShape: "wide",
    pupilScale: 1.05,
    mouthCurve: "smile",
    glowIntensity: 0.35,
    breathAmplitude: 2.0,
    breathPeriod: 4.5,
    blinkRange: [3000, 5500],
    transitionMs: 400,
    colors: P.tealActive,
  },

  listening: {
    ...D,
    eyeShape: "wide",
    pupilScale: 1.06,
    glowIntensity: 0.38,
    breathAmplitude: 1.5,
    breathPeriod: 4,
    blinkRange: [3500, 5800],
    colors: P.tealActive,
  },

  thinking: {
    ...D,
    eyeShape: "narrow",
    pupilScale: 0.92,
    mouthCurve: "neutral",
    glowIntensity: 0.3,
    breathAmplitude: 1.5,
    breathPeriod: 5.5,
    blinkRange: [4500, 7500],
    transitionMs: 600,
    colors: P.blue,
  },

  analyzing: {
    ...D,
    eyeShape: "narrow",
    pupilScale: 0.9,
    mouthCurve: "neutral",
    glowIntensity: 0.3,
    breathAmplitude: 1.2,
    breathPeriod: 5.5,
    blinkRange: [4500, 7500],
    colors: P.blue,
  },

  sign_detected: {
    ...D,
    eyeShape: "wide",
    pupilScale: 1.08,
    glowIntensity: 0.36,
    breathAmplitude: 2,
    breathPeriod: 4,
    transitionMs: 350,
    colors: P.tealActive,
  },

  translating: {
    ...D,
    eyeShape: "narrow",
    pupilScale: 0.92,
    mouthCurve: "neutral",
    glowIntensity: 0.3,
    breathAmplitude: 1.5,
    breathPeriod: 4.5,
    colors: P.purple,
  },

  speaking: {
    ...D,
    mouthCurve: "open",
    glowIntensity: 0.42,
    breathAmplitude: 1.8,
    breathPeriod: 4,
    blinkRange: [3000, 5200],
    transitionMs: 300,
    colors: P.speaking,
  },

  understanding: {
    ...D,
    eyeShape: "crescent",
    mouthCurve: "wide-smile",
    glowIntensity: 0.4,
    transitionMs: 400,
    colors: P.green,
  },

  happy: {
    ...D,
    eyeShape: "crescent",
    pupilScale: 1.04,
    mouthCurve: "wide-smile",
    glowIntensity: 0.42,
    breathAmplitude: 3,
    breathPeriod: 4,
    transitionMs: 400,
    colors: P.green,
  },

  curious: {
    ...D,
    eyeShape: "wide",
    pupilScale: 1.08,
    mouthCurve: "neutral",
    glowIntensity: 0.34,
    headTiltZ: 4,
    blinkRange: [3000, 5500],
    colors: P.cyan,
  },

  confused: {
    ...D,
    rightEyeShape: "squint",
    pupilScale: 0.94,
    mouthCurve: "slight-frown",
    glowIntensity: 0.28,
    headTiltZ: -4,
    breathAmplitude: 1.5,
    breathPeriod: 5.5,
    colors: P.orange,
  },

  reassuring: {
    ...D,
    glowIntensity: 0.32,
    colors: P.orange,
  },

  low_confidence: {
    ...D,
    eyeShape: "narrow",
    pupilScale: 0.92,
    mouthCurve: "neutral",
    glowIntensity: 0.24,
    headTiltZ: -2,
    colors: P.orange,
  },

  executing_command: {
    ...D,
    eyeShape: "narrow",
    pupilScale: 0.94,
    mouthCurve: "neutral",
    glowIntensity: 0.36,
    breathAmplitude: 1,
    breathPeriod: 3.5,
    transitionMs: 300,
    colors: P.command,
  },

  success: {
    ...D,
    eyeShape: "crescent",
    mouthCurve: "wide-smile",
    glowIntensity: 0.44,
    transitionMs: 350,
    colors: P.green,
  },

  error: {
    ...D,
    pupilScale: 0.9,
    mouthCurve: "flat",
    glowIntensity: 0.24,
    breathAmplitude: 1.5,
    breathPeriod: 6,
    blinkRange: [5000, 8000],
    transitionMs: 600,
    colors: P.rose,
  },

  paused: {
    ...D,
    eyeShape: "closed",
    pupilScale: 0.85,
    mouthCurve: "neutral",
    glowIntensity: 0.1,
    breathAmplitude: 2,
    breathPeriod: 7,
    blinkRange: [9000, 14000],
    transitionMs: 700,
    colors: P.slate,
  },
}

export function getStateConfig(
  expression: AvatarExpressionState,
): AvatarStateConfig {
  return CONFIGS[expression] ?? CONFIGS.idle
}

export function getStateColors(expression: AvatarExpressionState): StateColors {
  return (CONFIGS[expression] ?? CONFIGS.idle).colors
}
