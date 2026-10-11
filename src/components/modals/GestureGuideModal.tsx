"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  BookOpen,
  Zap,
  X,
  Sparkles,
  ArrowRight,
  Hand,
  Play,
  CheckCircle,
} from "lucide-react"
import { SIGN_LEXICON, COMMAND_LEXICON, gestureEngine } from "@/services/gestureEngine"
import { useMirageStore } from "@/store/mirageStore"
import type { GestureCommandType, SignToken } from "@/types/mirage"

interface GestureGuideModalProps {
  onClose: () => void
}

export default function GestureGuideModal({ onClose }: GestureGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"signs" | "commands">("signs")
  const addSignToken = useMirageStore((s) => s.addSignToken)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const signLanguage = useMirageStore((s) => s.settings.signLanguage)

  const handleTestSign = (entry: typeof SIGN_LEXICON[0]) => {
    const token: SignToken = {
      id: crypto.randomUUID(),
      token: entry.token,
      gloss: entry.gloss,
      translation: entry.translation,
      confidence: 0.97,
      timestamp: Date.now(),
      language: signLanguage,
    }

    setAvatarExpression("sign_detected")
    setTimeout(() => {
      addSignToken(token)
      setAvatarExpression("translating")
    }, 250)

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl rounded-3xl bg-[#0F141C] border border-white/10 p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#5EEAD4]/10 text-[#5EEAD4]">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-medium text-white/95">
                Gesture & Sign Language Lexicon
              </h3>
              <p className="text-xs text-white/50">
                Supported linguistic signs and system control commands
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 pb-2">
          <button
            onClick={() => setActiveTab("signs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition ${
              activeTab === "signs"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/40"
                : "bg-white/5 text-white/50 hover:text-white/80 border border-transparent"
            }`}
          >
            <span>🤟</span>
            <span>Linguistic Signs ({SIGN_LEXICON.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("commands")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition ${
              activeTab === "commands"
                ? "bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/40"
                : "bg-white/5 text-white/50 hover:text-white/80 border border-transparent"
            }`}
          >
            <Zap size={13} />
            <span>System Commands (7)</span>
          </button>
        </div>

        {/* List of Signs or Commands */}
        <div className="flex-1 overflow-y-auto mt-3 py-2 space-y-3 pr-1">
          {activeTab === "signs" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SIGN_LEXICON.map((entry) => (
                <div
                  key={entry.token}
                  className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-[#5EEAD4]/30 transition flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#5EEAD4] tracking-wider">
                        {entry.gloss}
                      </span>
                      <span className="text-[10px] font-mono text-white/40 uppercase">
                        {entry.handshape}
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-white/95 mt-1">
                      {entry.name}
                    </h4>

                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      {entry.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-col gap-1 text-[11px] text-white/70">
                      <div>
                        <span className="text-white/40">EN: </span>
                        {entry.translation.en}
                      </div>
                      <div>
                        <span className="text-white/40">FR: </span>
                        {entry.translation.fr}
                      </div>
                      <div dir="rtl" className="text-right font-sans">
                        <span className="text-white/40">AR: </span>
                        {entry.translation.ar}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTestSign(entry)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#5EEAD4]/15 text-[#5EEAD4] text-xs font-medium border border-transparent hover:border-[#5EEAD4]/30 transition"
                  >
                    <Play size={12} /> Test Sign in Studio
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(COMMAND_LEXICON).map(([type, cmd]) => (
                <div
                  key={type}
                  className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-[#FB923C]/30 transition flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#FB923C]">
                        {type.toUpperCase()}
                      </span>
                      {cmd.requiresConfirmation && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          Confirmation Required
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-medium text-white/95 mt-1">
                      {cmd.label}
                    </h4>

                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      {cmd.description}
                    </p>
                  </div>

                  <div className="mt-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2 text-xs text-[#FB923C]">
                    <Hand size={14} />
                    <span className="font-light">{cmd.gesture}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/40">
          <span>Conventional keyboard shortcuts are always active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 transition"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}
