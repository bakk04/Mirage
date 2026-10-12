"use client"

// Execute a gesture command

// Handle countdown for commands that require confirmation

// Progress countdown for confirmation
/* Header */ /* Action Details */ /* Confirmation Countdown Bar */ /* Manual Buttons */

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Zap, Check, X } from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { speechService } from "@/services/speechService"
import type { GestureCommand } from "@/types/mirage"

export default function GestureCommandFeedback() {
  const currentCommand = useMirageStore((s) => s.currentCommand)
  const setCurrentCommand = useMirageStore((s) => s.setCurrentCommand)
  const isSessionPaused = useMirageStore((s) => s.isSessionPaused)
  const setIsSessionPaused = useMirageStore((s) => s.setIsSessionPaused)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const setActivePanel = useMirageStore((s) => s.setActivePanel)
  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)
  const addMessage = useMirageStore((s) => s.addMessage)
  const messages = useMirageStore((s) => s.messages)

  const [confirmProgress, setConfirmProgress] = useState(0)
  const executeCommand = (cmd: GestureCommand) => {
    setAvatarExpression("executing_command")

    switch (cmd.type) {
      case "pause_resume":
        setIsSessionPaused(!isSessionPaused)
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          source: "command",
          content: isSessionPaused
            ? "Gesture Command: Translation session resumed."
            : "Gesture Command: Translation session paused.",
          timestamp: new Date(),
          language: settings.spokenLanguage,
        })
        break

      case "repeat_speech": {
        const lastSpoken = [...messages].reverse().find(
          (m) =>
            m.content &&
            m.role ===
              "user",
        )
        if (lastSpoken) {
          void speechService.speak(lastSpoken.content, settings.spokenLanguage)
          addMessage({
            id: crypto.randomUUID(),
            role: "system",
            source: "command",
            content: `Gesture Command: Repeating "${lastSpoken.content}"`,
            timestamp: new Date(),
            language: settings.spokenLanguage,
          })
        }
        break
      }

      case "toggle_audio": {
        const newAutoSpeak = !settings.autoSpeak
        updateSettings({ autoSpeak: newAutoSpeak })
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          source: "command",
          content: `Gesture Command: Auto-voice output ${
            newAutoSpeak ? "enabled" : "muted"
          }.`,
          timestamp: new Date(),
          language: settings.spokenLanguage,
        })
        break
      }

      case "switch_mode": {
        const nextLang =
          settings.signLanguage ===
          "asl"
            ? "lsf"
            : settings.signLanguage ===
                "lsf"
              ? "arsl"
              : "asl"
        updateSettings({ signLanguage: nextLang })
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          source: "command",
          content: `Gesture Command: Switched sign language to ${nextLang.toUpperCase()}.`,
          timestamp: new Date(),
          language: settings.spokenLanguage,
        })
        break
      }

      case "open_guide":
        setActivePanel("guide")
        break

      case "open_diagnostics":
        setActivePanel("diagnostics")
        break

      case "stop_session":
        setIsSessionPaused(true)
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          source: "command",
          content: "Gesture Command: Session concluded safely.",
          timestamp: new Date(),
          language: settings.spokenLanguage,
        })
        break

      default:
        break
    }

    setAvatarExpression("success")
    setTimeout(() => {
      setCurrentCommand(null)
      setAvatarExpression("idle")
    }, 1800)
  }
  useEffect(() => {
    if (!currentCommand) {
      setConfirmProgress(0)
      return
    }

    if (!currentCommand.requiresConfirmation) {
      executeCommand(currentCommand)
      return
    }
    const duration = 2400
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const prog = Math.min(100, (elapsed / duration) * 100)
      setConfirmProgress(prog)
      if (prog >= 100) {
        clearInterval(timer)
        executeCommand(currentCommand)
      }
    }, 40)

    return () => clearInterval(timer)
  }, [currentCommand])

  if (!currentCommand) return null

  return (
    <AnimatePresence>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#191F2B]/95 border border-[#F2AE75]/35 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl max-w-sm min-w-[280px] apple-specular-edge"
        >
          {}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#F2AE75]/15 text-[#F2AE75]">
                <Zap size={13} />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#F2AE75] font-semibold">
                Gesture Command Detected
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#A1ACBC]">
              {Math.round(currentCommand.confidence * 100)}%
            </span>
          </div>

          {}
          <div className="mt-0.5">
            <h4 className="text-xs font-semibold text-[#F4F7FB]">
              {currentCommand.label}
            </h4>
            <p className="text-[11px] text-[#A1ACBC] mt-0.5 leading-relaxed">
              {currentCommand.description}
            </p>
          </div>

          {}
          {currentCommand.requiresConfirmation && (
            <div className="mt-1.5 flex flex-col gap-1">
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#F2AE75] transition-all duration-75"
                  style={{ width: `${confirmProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#737F91] text-right">
                Hold to execute or dismiss below
              </span>
            </div>
          )}

          {}
          <div className="mt-1.5 pt-2 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              onClick={() => setCurrentCommand(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#A1ACBC] hover:text-[#F4F7FB] bg-white/[0.05] hover:bg-white/[0.09] transition cursor-pointer"
            >
              <X size={12} /> Dismiss
            </button>
            <button
              onClick={() => executeCommand(currentCommand)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-[#0B0D12] bg-[#F2AE75] hover:bg-[#E09C63] transition shadow-xs cursor-pointer"
            >
              <Check size={12} /> Confirm Now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
