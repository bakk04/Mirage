"use client" /* Radiating rings behind orb */ /* Orb placeholder — renders from App via layoutId */ /* Speaking label */
import { motion } from "motion/react"

function RadiatingRing({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        border: "1px solid rgba(94,234,212,0.4)",
      }}
      animate={{
        scale: [1, 2.2],
        opacity: [0.4, 0],
      }}
      transition={{
        duration: 2.4,
        ease: "easeOut",
        repeat: Infinity,
        delay,
      }}
    />
  )
}

export default function SpeakingState({
  amplitude = 0,
}: {
  amplitude?: number
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-16 h-full">
      {}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 300, height: 300 }}
      >
        <div className="absolute" style={{ width: 240, height: 240 }}>
          <RadiatingRing delay={0} />
          <RadiatingRing delay={0.7} />
          <RadiatingRing delay={1.4} />
        </div>

        {}
        <motion.div
          style={{ width: 240, height: 240, position: "relative", zIndex: 1 }}
          animate={{
            scale: 1 + amplitude * 0.08,
          }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {}
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
        Speaking…
      </motion.p>
    </div>
  )
}
