"use client"

// Organic blob rings
/* Concentric organic rings */ /* Orb placeholder */

import { motion } from "motion/react"
function OrganicRing({
  delay,
  opacity,
  size,
  amplitude,
}: {
  delay: number
  opacity: number
  size: number
  amplitude: number
}) {
  const paths = [
    "M200,100 C240,60 290,80 300,120 C310,160 280,200 240,210 C200,220 160,200 150,165 C140,130 160,140 200,100Z",
    "M200,95 C245,55 295,85 305,125 C315,165 282,205 238,212 C194,219 155,197 148,160 C141,123 155,135 200,95Z",
    "M200,105 C237,65 287,77 297,117 C307,157 276,197 238,208 C200,219 163,203 154,168 C145,133 163,145 200,105Z",
  ]

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={{ scale: 1 + amplitude * 0.15 }}
      transition={{ duration: 0.1 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        style={{ position: "absolute" }}
      >
        <motion.path
          fill="none"
          stroke="#5EEAD4"
          strokeWidth="1"
          opacity={opacity}
          animate={{
            d: [paths[0], paths[1], paths[2], paths[1], paths[0]],
          }}
          transition={{
            duration: 3.5 + delay,
            ease: "easeInOut",
            repeat: Infinity,
            delay,
          }}
        />
      </svg>
    </motion.div>
  )
}

export default function ListeningState({
  amplitude = 0,
}: {
  amplitude?: number
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-16 h-full">
      {}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 400, height: 400 }}
      >
        <OrganicRing
          delay={0}
          opacity={0.35}
          size={380}
          amplitude={amplitude}
        />
        <OrganicRing
          delay={0.8}
          opacity={0.2}
          size={340}
          amplitude={amplitude * 0.8}
        />
        <OrganicRing
          delay={1.6}
          opacity={0.1}
          size={300}
          amplitude={amplitude * 0.6}
        />

        {}
        <div
          style={{ width: 240, height: 240, position: "relative", zIndex: 1 }}
        />
      </div>

      <motion.p
        aria-live="polite"
        role="status"
        className="tracking-widest"
        style={{
          fontSize: 14,
          fontWeight: 200,
          color: "rgba(140,149,163,0.7)",
          letterSpacing: "0.2em",
        }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
        initial={{ opacity: 0 }}
      >
        Listening…
      </motion.p>
    </div>
  )
}
