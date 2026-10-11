"use client"

import { motion, AnimatePresence } from "motion/react"
import { Eye, Mic, Sparkles, Volume2, Hand } from "lucide-react"
import { useMirageStore, STATE_LABELS, AVATAR_EXPRESSION_LABELS } from "@/store/mirageStore"
import { zIndex } from "@/lib/designSystem"

export default function StatusPill({
  micPermission: _micPermission,
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
      className="hidden xl:flex items-center gap-2 rounded-full px-3 py-1 bg-[#1A1D25] border border-white/[0.08] shadow-sm text-xs font-mono"
    >
      {/* Status Dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: isSessionPaused
            ? "#F5A25D"
            : avatarExpression === "error"
              ? "#EF4444"
              : "#3DDBB5",
        }}
        aria-hidden="true"
      />

      {/* Status Text */}
      <span className="text-[11px] tracking-wider uppercase text-white/80 font-medium whitespace-nowrap">
        {label}
      </span>

      {/* Contextual Icon */}
      {isAudioPlaying && (
        <Volume2 size={12} className="text-[#3DDBB5] animate-pulse" />
      )}
      {state === "camera" && (
        <Hand size={12} className="text-[#3DDBB5]" />
      )}
      {state === "listening" && (
        <Mic size={12} className="text-sky-400 animate-pulse" />
      )}
    </motion.div>
  )
}
