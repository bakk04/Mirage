"use client" /* Dot indicator */
import { motion, AnimatePresence } from "motion/react"
import { Eye } from "lucide-react"
import { useMirageStore, STATE_LABELS } from "@/store/mirageStore"

function ListeningDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: "#5EEAD4" }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

function ThinkingShimmer() {
  return (
    <div
      className="w-12 h-1 rounded-full overflow-hidden"
      style={{ background: "rgba(94,234,212,0.2)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, #5EEAD4, transparent)",
          width: "60%",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  )
}

export default function StatusPill() {
  const state = useMirageStore((s) => s.state)
  const label = STATE_LABELS[state]

  const pillContent = () => {
    if (state === "listening") return <ListeningDots />
    if (state === "camera" || state === "understanding")
      return <Eye size={12} strokeWidth={1.5} style={{ color: "#5EEAD4" }} />
    if (state === "conversation") return <ThinkingShimmer />
    if (state === "speaking")
      return (
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 1, 0].map((h, i) => (
            <motion.div
              key={i}
              className="w-0.5 rounded-full"
              style={{ background: "#5EEAD4", height: 4 + h * 3 }}
              animate={{ scaleY: [1, 1.5 + h * 0.3, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.08,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )
    return null
  }

  return (
    <motion.div
      layout
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full glass"
      style={{
        boxShadow:
          "0 0 0 1px rgba(94,234,212,0.15), 0 8px 32px rgba(0,0,0,0.4)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {}
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "#5EEAD4" }}
        animate={{
          opacity: state === "idle" ? [0.5, 1, 0.5] : 1,
          scale:
            state === "listening" || state === "speaking" ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          className="text-xs tracking-widest"
          style={{
            color: "rgba(244,245,247,0.6)",
            fontWeight: 300,
            letterSpacing: "0.12em",
          }}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.3 }}
        >
          {label.toUpperCase()}
        </motion.span>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {pillContent() && (
          <motion.div
            key={state}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden flex items-center"
          >
            {pillContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
