export const colors = {
  // Brand Foundation Tokens
  background: "#0B0D12",
  backgroundSecondary: "#10141C",
  surface: "rgba(25, 31, 43, 0.72)",
  surfaceSolid: "#191F2B",
  surfaceSubdued: "#10141C",
  surfaceElevated: "rgba(32, 40, 54, 0.85)",
  surfaceHover: "rgba(255, 255, 255, 0.06)",

  // Typography Tokens
  textPrimary: "#F4F7FB",
  textSecondary: "#A1ACBC",
  textMuted: "#737F91",

  // Cohesive Accent Tokens
  primary: "#43D9BD", // Primary Teal / Turquoise
  primaryHover: "#34C7A8",
  primaryMuted: "rgba(67, 217, 189, 0.14)",
  primaryBorder: "rgba(67, 217, 189, 0.32)",
  primaryGlow: "rgba(67, 217, 189, 0.22)",

  secondary: "#45B9F5", // Sky Cyan
  secondaryHover: "#32A5E2",
  secondaryMuted: "rgba(69, 185, 245, 0.14)",
  secondaryBorder: "rgba(69, 185, 245, 0.32)",

  warm: "#F2AE75", // Warm Amber Accent (used sparingly)
  warmHover: "#E09C63",
  warmMuted: "rgba(242, 174, 117, 0.14)",
  warmBorder: "rgba(242, 174, 117, 0.30)",

  // Backward-compatibility aliases
  turquoise: "#43D9BD",
  turquoiseHover: "#34C7A8",
  cyan: "#45B9F5",
  blue: "#45B9F5",
  royalBlue: "#32A5E2",
  orange: "#F2AE75",

  // Semantic Status Tokens
  statusSuccess: "#34D399",
  statusWarning: "#F2AE75",
  statusError: "#F87171",
  statusInfo: "#45B9F5",

  // Liquid Glass Material System Tokens
  glassBackground: "rgba(25, 31, 43, 0.72)",
  glassBackgroundSubdued: "rgba(16, 20, 28, 0.78)",
  glassBackgroundElevated: "rgba(32, 40, 54, 0.85)",
  glassBorder: "rgba(255, 255, 255, 0.10)",
  glassBorderStrong: "rgba(255, 255, 255, 0.16)",
  glassHighlight: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  borderDefault: "rgba(255, 255, 255, 0.10)",
  borderStrong: "rgba(255, 255, 255, 0.18)",
} as const

// Mathematical Spacing Scale (4px base unit)
export const space = {
  0: 0,
  1: 4, // 4px - micro adjustments
  2: 8, // 8px - compact spacing
  3: 12, // 12px - closely related elements
  4: 16, // 16px - standard component spacing
  5: 20, // 20px - intermediate component separation
  6: 24, // 24px - card and section padding
  8: 32, // 32px - major content separation
  10: 40, // 40px - structural layout spacing
  12: 48, // 48px - large section separation
  16: 64, // 64px - major container spacing
} as const

// Typography Scale (font-size / line-height)
export const typography = {
  display: {
    size: "28px",
    lineHeight: "36px",
    weight: 600,
    letterSpacing: "-0.02em",
  },
  pageTitle: {
    size: "20px",
    lineHeight: "28px",
    weight: 600,
    letterSpacing: "-0.01em",
  },
  sectionTitle: {
    size: "16px",
    lineHeight: "24px",
    weight: 600,
    letterSpacing: "-0.005em",
  },
  cardTitle: {
    size: "14px",
    lineHeight: "20px",
    weight: 600,
    letterSpacing: "0em",
  },
  body: {
    size: "14px",
    lineHeight: "22px",
    weight: 400,
    letterSpacing: "0.01em",
  },
  bodyLg: {
    size: "16px",
    lineHeight: "26px",
    weight: 400,
    letterSpacing: "0.01em",
  },
  secondary: {
    size: "13px",
    lineHeight: "18px",
    weight: 400,
    letterSpacing: "0.01em",
  },
  label: {
    size: "12px",
    lineHeight: "16px",
    weight: 500,
    letterSpacing: "0.02em",
  },
  caption: {
    size: "11px",
    lineHeight: "14px",
    weight: 500,
    letterSpacing: "0.04em",
  },
  mono: {
    size: "11px",
    lineHeight: "15px",
    weight: 500,
    letterSpacing: "0.06em",
  },
} as const

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  pill: 9999,
} as const

export const sizes = {
  touchTarget: 44,
  buttonSm: 32,
  buttonMd: 38,
  buttonLg: 44,
  navHeight: 56,
  dockHeight: 48,
  dockButton: 40,
  maxContentWidth: 1440,
  orb: 180,
} as const

export const motionTokens = {
  duration: {
    instant: 100,
    quick: 180,
    standard: 260,
    smooth: 380,
    deliberate: 550,
  },
  ease: {
    standard: [0.2, 0, 0, 1] as const,
    reveal: [0.16, 1, 0.3, 1] as const,
    natural: [0.4, 0, 0.2, 1] as const,
  },
  spring: {
    snappy: { stiffness: 350, damping: 28 },
    gentle: { stiffness: 180, damping: 22 },
  },
} as const

export const zIndex = {
  background: 0,
  media: 10,
  scrim: 20,
  orb: 30,
  overlays: 40,
  nav: 50,
  dock: 60,
  popovers: 65,
  modals: 70,
  hud: 80,
} as const
