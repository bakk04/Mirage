"use client"

import { motion } from "motion/react"
import { BookOpen, Hand, X, Zap } from "lucide-react"
import { MEDIAPIPE_GESTURE_COMMANDS } from "@/services/mediaPipeGestureRecognizer"

interface GestureGuideModalProps {
  onClose: () => void
}

export default function GestureGuideModal({ onClose }: GestureGuideModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gesture-guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-2xl rounded-2xl bg-[#191F2B]/95 border border-white/[0.12] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh] overflow-hidden apple-specular-edge"
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#43D9BD]/12 text-[#43D9BD] border border-[#43D9BD]/25">
              <BookOpen size={17} />
            </div>
            <div>
              <h3
                id="gesture-guide-modal-title"
                className="text-sm font-semibold text-[#F4F7FB]"
              >
                Gesture Command Guide
              </h3>
              <p className="text-xs text-[#A1ACBC]">
                Verified MediaPipe control categories only
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer"
            aria-label="Close guide"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-3.5 p-3 rounded-xl bg-[#F2AE75]/10 border border-[#F2AE75]/25 text-xs text-[#F2AE75] leading-relaxed">
          Arabic-sign labels are intentionally not shown here: they will appear
          only after a verified Arabic-specific model and class map are
          installed. This guide does not trigger recognition or insert demo
          tokens.
        </div>

        <div className="flex-1 overflow-y-auto mt-3 py-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
          {MEDIAPIPE_GESTURE_COMMANDS.map((command) => (
            <div
              key={command.commandType}
              className="p-3.5 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08] flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F2AE75]">
                    {command.gestureName}
                  </span>
                  {command.requiresConfirmation && (
                    <span className="text-[10px] text-[#F2AE75]/90 font-mono">
                      Confirmation req.
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-[#F4F7FB] mt-1">
                  {command.label}
                </h4>
                <p className="text-xs text-[#A1ACBC] mt-1 leading-relaxed">
                  {command.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#F2AE75]">
                <Hand size={13} />
                <span>
                  Min confidence: {Math.round(command.minConfidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#737F91]">
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-[#43D9BD]" />
            <span>Commands use cooldown protection.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-[#F4F7FB] text-xs font-medium transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}
