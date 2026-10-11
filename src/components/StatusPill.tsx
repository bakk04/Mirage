"use client"

import { motion, AnimatePresence } from "motion/react"
import { Eye, Mic, Sparkles, Volume2, Hand } from "lucide-react"
import { useMirageStore, STATE_LABELS, AVATAR_EXPRESSION_LABELS } from "@/store/mirageStore"
import { zIndex } from "@/lib/designSystem"

export default function StatusPill({
  micPermission,
}: {
  micPermission?: "idle" | "prompting" | "granted" | "denied" | "unavailable" | "error"
}) {
  const state = useMirageStore((s) => s.state)
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const isSessionPaused = useMirageStore((s) => s.isSessionPaused)

  const label = isSessionPaused
    ? "PAUSED"
    : AVATAR_EXPRESSION_LABELS[avatarExpression] || STATE_LABELS[state]

  return (
    <motion.div
      layout
      className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 flex items-center gap-2.5 rounded-full glass px-4 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#5EEAD4]/20"
      style={{ zIndex: zIndex.overlays }}
    >
      {/* Status Dot */}
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{
          background: isSessionPaused
            ? "#FB923C"
            : avatarExpression === "error"
              ? "#FB7185"
              : "#5EEAD4",
        }}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Status Text */}
      <span className="text-[11px] font-mono tracking-widest uppercase text-white/85">
        {label}
      </span>

      {/* Contextual Icon / Animation */}
      {isAudioPlaying && (
        <Volume2 size={12} className="text-[#5EEAD4] animate-pulse" />
      )}
      {state === "camera" && (
        <Hand size={12} className="text-[#5EEAD4]" />
      )}
      {state === "listening" && (
        <Mic size={12} className="text-[#22D3EE] animate-pulse" />
      )}
    </motion.div>
  )
}
