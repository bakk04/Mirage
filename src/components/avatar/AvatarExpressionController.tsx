"use client" /* Primary Expression Status Pill with Preset Trigger */ /* Popover Expression Menu (Progressive Disclosure) */ /* Backdrop for easy dismiss */
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { useMirageStore, AVATAR_EXPRESSION_LABELS } from "@/store/mirageStore"
import type { AvatarExpressionState } from "@/types/mirage"
import { getStateColors } from "@/components/avatar/AvatarStateMachine"

export default function AvatarExpressionController() {
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)

  const [isOpen, setIsOpen] = useState(false)

  const stateCategories: {
    category: string
    items: {
      id: AvatarExpressionState
      label: string
    }[]
  }[] = [
    {
      category: "Workflow",
      items: [
        { id: "idle", label: "Idle / Ready" },
        { id: "observing", label: "Observing Camera" },
        { id: "listening", label: "Listening Voice" },
        { id: "speaking", label: "Speaking" },
        { id: "understanding", label: "Understood" },
      ],
    },
    {
      category: "Feedback & Empathy",
      items: [
        { id: "thinking", label: "Thinking" },
        { id: "happy", label: "Welcoming" },
        { id: "curious", label: "Curious" },
        { id: "reassuring", label: "Reassuring" },
        { id: "success", label: "Success" },
        { id: "paused", label: "Paused" },
      ],
    },
  ]

  const activeColors = getStateColors(avatarExpression)
  const activeLabel =
    AVATAR_EXPRESSION_LABELS[avatarExpression]?.split("·")[0]?.trim() ||
    avatarExpression

  return (
    <div className="relative flex flex-col items-center">
      {}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0B0D12]/70 border border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-2 pl-3 pr-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: activeColors.primary || "#43D9BD" }}
            aria-hidden="true"
          />
          <span className="text-xs font-mono tracking-wider text-[#F4F7FB] uppercase font-medium">
            {activeLabel}
          </span>
          {isAudioPlaying && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#43D9BD] animate-ping"
              title="Speaking Audio Active"
            />
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition cursor-pointer ${
            isOpen
              ? "bg-[#43D9BD]/20 text-[#43D9BD] border border-[#43D9BD]/40"
              : "text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.06]"
          }`}
          aria-expanded={isOpen}
          aria-label="Toggle avatar expression presets"
          title="Select avatar expression preset"
        >
          <SlidersHorizontal size={11} />
          <span className="hidden sm:inline">Presets</span>
          <ChevronDown
            size={11}
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {}
      <AnimatePresence>
        {isOpen && (
          <>
            {}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              className="absolute bottom-full mb-3 z-40 w-72 sm:w-80 p-3 rounded-2xl bg-[#191F2B]/95 border border-white/[0.12] shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#F4F7FB]">
                  <Sparkles size={12} className="text-[#43D9BD]" />
                  <span>Avatar Expression State</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/5 transition"
                  aria-label="Close presets"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {stateCategories.map((cat) => (
                  <div key={cat.category}>
                    <span className="text-[10px] font-mono text-[#737F91] uppercase tracking-wider block mb-1">
                      {cat.category}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cat.items.map(({ id, label }) => {
                        const isActive = avatarExpression === id
                        const stateColors = getStateColors(id)
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              setAvatarExpression(id)
                              setIsOpen(false)
                            }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-mono transition cursor-pointer ${
                              isActive
                                ? "bg-[#43D9BD]/15 text-[#43D9BD] border border-[#43D9BD]/35 font-medium"
                                : "bg-white/[0.03] text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.07] border border-transparent"
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  stateColors.primary || "#43D9BD",
                              }}
                            />
                            <span className="truncate">{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
