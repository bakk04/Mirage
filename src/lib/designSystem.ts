export const colors = {
  // Brand Palette
  background: "#12141A",
  surface: "#1A1D25",
  surfaceSubdued: "#161920",
  surfaceElevated: "#222631",
  surfaceHover: "#282D3A",

  // Typography
  textPrimary: "#F4F5F7",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",

  // Accents
  primary: "#3DDBB5", // Teal: attention, primary actions, active states
  primaryHover: "#4EEBC5",
  primaryMuted: "rgba(61, 219, 181, 0.12)",
  primaryBorder: "rgba(61, 219, 181, 0.28)",
  turquoise: "#3DDBB5", // Brand Teal alias

  secondary: "#F5A25D", // Warm Amber/Orange: secondary emphasis, notices
  secondaryHover: "#FBBF24",
  secondaryMuted: "rgba(245, 162, 93, 0.12)",
  secondaryBorder: "rgba(245, 162, 93, 0.3)",
  orange: "#F5A25D", // Brand Amber alias

  // Semantic Status
  statusSuccess: "#10B981",
  statusWarning: "#F59E0B",
  statusError: "#EF4444",
  statusInfo: "#38BDF8",

  // Borders & Dividers
  borderSubtle: "rgba(255, 255, 255, 0.07)",
  borderDefault: "rgba(255, 255, 255, 0.12)",
  borderStrong: "rgba(255, 255, 255, 0.2)",
} as const

// Mathematical Spacing Scale (4px base unit)
export const space = {
  0: 0,
  1: 4,   // 4px - micro adjustments
  2: 8,   // 8px - compact spacing
  3: 12,  // 12px - closely related elements
  4: 16,  // 16px - standard component spacing
  5: 20,  // 20px - intermediate component separation
  6: 24,  // 24px - card and section padding
  8: 32,  // 32px - major content separation
  10: 40, // 40px - structural layout spacing
  12: 48, // 48px - large section separation
  16: 64, // 64px - major container spacing
} as const

// Typography Scale (font-size / line-height)
export const typography = {
  display: { size: "28px", lineHeight: "36px", weight: 600, letterSpacing: "-0.02em" },
  pageTitle: { size: "20px", lineHeight: "28px", weight: 600, letterSpacing: "-0.01em" },
  sectionTitle: { size: "16px", lineHeight: "24px", weight: 600, letterSpacing: "-0.005em" },
  cardTitle: { size: "14px", lineHeight: "20px", weight: 600, letterSpacing: "0em" },
  body: { size: "14px", lineHeight: "22px", weight: 400, letterSpacing: "0.01em" },
  bodyLg: { size: "16px", lineHeight: "26px", weight: 400, letterSpacing: "0.01em" },
  secondary: { size: "13px", lineHeight: "18px", weight: 400, letterSpacing: "0.01em" },
  label: { size: "12px", lineHeight: "16px", weight: 500, letterSpacing: "0.02em" },
  caption: { size: "11px", lineHeight: "14px", weight: 500, letterSpacing: "0.04em" },
  mono: { size: "11px", lineHeight: "15px", weight: 500, letterSpacing: "0.06em" },
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
  buttonMd: 40,
  buttonLg: 48,
  navHeight: 64,
  dockHeight: 64,
  dockButton: 44,
  maxContentWidth: 1400,
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
    metaStandard: [0.2, 0, 0, 1] as const, // Meta-style ease-out curve
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

