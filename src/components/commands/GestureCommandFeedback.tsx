"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Zap,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  Activity,
  Layers,
} from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { speechService } from "@/services/speechService"
import type { GestureCommand, GestureCommandType } from "@/types/mirage"

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

  // Execute a gesture command
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
        const lastSpoken = [...messages]
          .reverse()
          .find((m) => m.content && m.role === "user")
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
          settings.signLanguage === "asl"
            ? "lsf"
            : settings.signLanguage === "lsf"
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

  // Handle countdown for commands that require confirmation
  useEffect(() => {
    if (!currentCommand) {
      setConfirmProgress(0)
      return
    }

    if (!currentCommand.requiresConfirmation) {
      executeCommand(currentCommand)
      return
    }

    // Progress countdown for confirmation
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
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          className="flex flex-col gap-2 p-4 rounded-2xl bg-[#11151A]/95 border border-[#FB923C]/50 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl max-w-sm min-w-[280px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#FB923C]/20 text-[#FB923C]">
                <Zap size={14} />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FB923C]">
                Gesture Command Detected
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/50">
              {Math.round(currentCommand.confidence * 100)}%
            </span>
          </div>

          {/* Action Details */}
          <div className="mt-1">
            <h4 className="text-sm font-medium text-white/95">
              {currentCommand.label}
            </h4>
            <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
              {currentCommand.description}
            </p>
          </div>

          {/* Confirmation Countdown Bar */}
          {currentCommand.requiresConfirmation && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#FB923C] transition-all duration-75"
                  style={{ width: `${confirmProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-white/40 text-right">
                Hold to execute or dismiss below
              </span>
            </div>
          )}

          {/* Manual Buttons */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              onClick={() => setCurrentCommand(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition"
            >
              <X size={12} /> Dismiss
            </button>
            <button
              onClick={() => executeCommand(currentCommand)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-black bg-[#FB923C] hover:bg-[#F97316] transition shadow-md"
            >
              <Check size={12} /> Confirm Now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
