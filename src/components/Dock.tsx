"use client"

import { useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useSpring,
} from "motion/react"
import {
  Mic,
  Camera,
  Type,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react"
import { useMirageStore, type MirageStateType } from "@/store/mirageStore"
import { sizes, zIndex } from "@/lib/designSystem"

interface DockItem {
  id: string
  icon: React.ReactNode
  label: string
  action: MirageStateType | "text" | "guide" | "audio_toggle"
}

interface DockProps {
  onListen?: () => void
  onOpenGuide?: () => void
}

export default function Dock({ onListen, onOpenGuide }: DockProps) {
  const mouseX = useMotionValue(Infinity)
  const [textOpen, setTextOpen] = useState(false)
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)
  const setActivePanel = useMirageStore((s) => s.setActivePanel)
  const addMessage = useMirageStore((s) => s.addMessage)
  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  const ITEMS: DockItem[] = [
    {
      id: "camera",
      icon: <Camera size={18} strokeWidth={1.5} />,
      label: "Sign Camera",
      action: "camera",
    },
    {
      id: "mic",
      icon: <Mic size={18} strokeWidth={1.5} />,
      label: "Voice Input",
      action: "listening",
    },
    {
      id: "text",
      icon: <Type size={18} strokeWidth={1.5} />,
      label: "Type Message",
      action: "text",
    },
    {
      id: "guide",
      icon: <BookOpen size={18} strokeWidth={1.5} />,
      label: "Gesture Guide",
      action: "guide",
    },
    {
      id: "audio",
      icon: settings.autoSpeak ? (
        <Volume2 size={18} strokeWidth={1.5} />
      ) : (
        <VolumeX size={18} strokeWidth={1.5} />
      ),
      label: settings.autoSpeak ? "Voice Output ON" : "Voice Output Muted",
      action: "audio_toggle",
    },
  ]

  const submitText = (value: string) => {
    const text = value.trim()
    if (!text) return
    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      source: "typed",
      content: text,
      timestamp: new Date(),
      language: settings.spokenLanguage,
    })
    setState("conversation")
    setTextOpen(false)
  }

  return (
    <div
      className="fixed bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      style={{
        zIndex: zIndex.dock,
        bottom: "calc(20px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Pop-up Text Composer */}
      <AnimatePresence>
        {textOpen && (
          <motion.div
            className="glass rounded-full overflow-hidden flex items-center px-4"
            initial={{ width: 0, opacity: 0, height: 42 }}
            animate={{ width: 300, opacity: 1, height: 42 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <input
              autoFocus
              className="flex-1 bg-transparent text-xs text-white/90 outline-none"
              placeholder="Ask MIRAGE anything…"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitText(e.currentTarget.value)
                if (e.key === "Escape") setTextOpen(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock Pill Container */}
      <motion.div
        className="mirage-dock flex items-center gap-2 px-3 py-2 rounded-full glass mobile-safe-bottom"
        style={{ zIndex: zIndex.dock, minHeight: sizes.dockButton + 8 }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {ITEMS.map((item) => {
          const isActive =
            item.action === "text"
              ? textOpen
              : item.action === "audio_toggle"
                ? settings.autoSpeak
                : state === item.action

          return (
            <motion.button
              key={item.id}
              aria-label={item.label}
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isActive
                  ? "rgba(94,234,212,0.15)"
                  : "rgba(255,255,255,0.04)",
                border: isActive
                  ? "1px solid rgba(94,234,212,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                color: isActive ? "#5EEAD4" : "rgba(140,149,163,0.8)",
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                if (item.action === "text") {
                  setTextOpen((v) => !v)
                } else if (item.action === "guide") {
                  onOpenGuide?.()
                } else if (item.action === "audio_toggle") {
                  updateSettings({ autoSpeak: !settings.autoSpeak })
                } else if (item.action === "listening") {
                  onListen?.()
                  setState("listening")
                } else {
                  setActivePanel("studio")
                  setState(item.action as MirageStateType)
                }
              }}
              title={item.label}
            >
              {item.icon}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
