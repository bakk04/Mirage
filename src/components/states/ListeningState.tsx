import { motion } from "motion/react"

export default function ListeningState() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center">
      <motion.p
        aria-live="polite"
        role="status"
        className="absolute top-[calc(44dvh+clamp(152px,18vw,184px))] rounded-full border border-white/10 bg-[#11151A]/55 px-4 py-2 text-sm font-light tracking-[0.14em] text-[#8C95A3] backdrop-blur-md"
        animate={{ opacity: [0.58, 0.86, 0.58], y: [0, -2, 0] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
      >
        Listening <span className="text-[#5EEAD4]">···</span>
      </motion.p>
    </div>
  )
}
