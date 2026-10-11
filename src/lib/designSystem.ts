export const colors = {
  background: "#080A0D",
  surface: "#11151A",
  surfaceRaised: "#171C22",
  text: "#F4F5F7",
  secondary: "#8C95A3",
  turquoise: "#5EEAD4",
  cyan: "#22D3EE",
  teal: "#0EA5A4",
  deepBlue: "#1E40AF",
  orange: "#FB923C",
} as const

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
  "5xl": 96,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const

export const sizes = {
  touch: 44,
  dockButton: 48,
  dockGap: 8,
  orb: 240,
  orbMobile: 200,
  orbContainer: 576,
  navHeight: 64,
} as const

export const motionTokens = {
  duration: {
    instant: 120,
    quick: 200,
    reveal: 400,
    medium: 600,
    slow: 800,
    long: 1200,
  },
  ease: {
    reveal: [0.22, 1, 0.36, 1] as const,
    loop: "easeInOut" as const,
  },
  spring: {
    movement: { stiffness: 120, damping: 20 },
    ui: { stiffness: 300, damping: 30 },
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
} as const
