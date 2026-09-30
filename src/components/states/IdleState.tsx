"use client" /* Orb placeholder — actual orb is rendered by App.tsx via layoutId */ /* Text */
import { motion } from "motion/react"

export default function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center gap-32 h-full">
      {}
      <div style={{ width: 240, height: 240 }} />

      {}
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.p
          className="tracking-wide"
          style={{
            fontSize: 32,
            fontWeight: 300,
            color: "rgba(244,245,247,0.9)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          I'm here.
        </motion.p>
        <motion.p
          className="tracking-widest"
          style={{
            fontSize: 14,
            fontWeight: 200,
            color: "rgba(140,149,163,0.7)",
            letterSpacing: "0.15em",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Show me something.
        </motion.p>
      </div>
    </div>
  )
}
