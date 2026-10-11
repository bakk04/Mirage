"use client" /* Gentle float animation */
import { motion } from "motion/react"
import { useMirageStore } from "@/store/mirageStore"

const CHIPS = [
  { id: "imagine", label: "Imagine this", action: "imagine" as const },
  { id: "remember", label: "Remember this", action: "memory" as const },
  { id: "more", label: "Tell me more", action: "conversation" as const },
]

export default function SuggestionChips({ visible }: { visible: boolean }) {
  const setState = useMirageStore((s) => s.setState)

  return (
    <div className="flex items-center gap-3">
      {CHIPS.map((chip, i) => (
        <motion.button
          key={chip.id}
          onClick={() => setState(chip.action)}
          className="glass rounded-full px-4 py-2 text-xs tracking-wider cursor-pointer"
          style={{
            color: "rgba(244,245,247,0.75)",
            fontWeight: 400,
            letterSpacing: "0.02em",
            border: "1px solid rgba(61, 219, 181, 0.22)",
            backgroundColor: "rgba(26, 29, 37, 0.75)",
            minHeight: "36px",
          }}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={
            visible
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 12, filter: "blur(4px)" }
          }
          transition={{
            duration: 0.5,
            delay: visible ? 0.6 + i * 0.1 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{
            scale: 1.04,
            borderColor: "rgba(61, 219, 181, 0.5)",
            color: "#F4F5F7",
          }}
          whileTap={{ scale: 0.96 }}
        >
          {}
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i * 1.5,
            }}
            style={{ display: "block" }}
          >
            {chip.label}
          </motion.span>
        </motion.button>
      ))}
    </div>
  )
}
