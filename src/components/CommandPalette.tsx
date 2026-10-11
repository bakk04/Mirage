"use client" /* Backdrop */ /* Palette */ /* Input row */ /* Results */
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, X } from "lucide-react"
import { useMirageStore, MirageStateType } from "@/store/mirageStore"
import { zIndex } from "@/lib/designSystem"

const COMMANDS = [
  { label: "Switch to Idle", shortcut: "1", action: "idle" as MirageStateType },
  {
    label: "Start Listening",
    shortcut: "2",
    action: "listening" as MirageStateType,
  },
  { label: "Open Camera", shortcut: "3", action: "camera" as MirageStateType },
  {
    label: "Analyze Scene",
    shortcut: "4",
    action: "understanding" as MirageStateType,
  },
  {
    label: "Start Conversation",
    shortcut: "5",
    action: "conversation" as MirageStateType,
  },
  {
    label: "Speaking Mode",
    shortcut: "6",
    action: "speaking" as MirageStateType,
  },
  { label: "Open Memory", shortcut: "7", action: "memory" as MirageStateType },
  {
    label: "Imagine Mode",
    shortcut: "8",
    action: "imagine" as MirageStateType,
  },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const setState = useMirageStore((s) => s.setState)
  const [query, setQuery] = useState("")

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const select = (action: MirageStateType) => {
    setState(action)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {}
          <motion.div
            className="fixed inset-0"
            style={{
              zIndex: zIndex.modals,
              backdropFilter: "blur(12px)",
              background: "rgba(8,10,13,0.6)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {}
          <motion.div
            className="fixed left-1/2 top-1/3 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: zIndex.modals + 1 }}
            role="dialog"
            aria-modal="true"
            aria-label="MIRAGE command palette"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(17,21,26,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow:
                  "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(94,234,212,0.1)",
                backdropFilter: "blur(40px)",
              }}
            >
              {}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <Search
                  size={16}
                  strokeWidth={1.5}
                  style={{ color: "rgba(140,149,163,0.5)" }}
                />
                <input
                  aria-label="Search MIRAGE commands"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask MIRAGE anything…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "rgba(244,245,247,0.9)", fontWeight: 300 }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") onClose()
                    if (e.key === "Enter" && filtered[0])
                      select(filtered[0].action)
                  }}
                />
                <kbd
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(140,149,163,0.5)",
                    fontWeight: 300,
                  }}
                >
                  esc
                </kbd>
                <button
                  className="flex min-h-11 min-w-11 items-center justify-center text-white/50 hover:text-white"
                  aria-label="Close command palette"
                  title="Close command palette"
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </div>

              {}
              <div
                className="py-2 max-h-72 overflow-y-auto"
                role="listbox"
                aria-label="Commands"
              >
                {filtered.map((cmd, i) => (
                  <motion.button
                    role="option"
                    aria-label={`${cmd.label}, shortcut ${cmd.shortcut}`}
                    key={cmd.action}
                    className="w-full flex items-center justify-between px-5 py-3 text-sm text-left"
                    style={{ color: "rgba(244,245,247,0.7)", fontWeight: 300 }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{
                      background: "rgba(94,234,212,0.06)",
                      color: "rgba(244,245,247,0.95)",
                    }}
                    onClick={() => select(cmd.action)}
                  >
                    <span>{cmd.label}</span>
                    <kbd
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(140,149,163,0.5)",
                      }}
                    >
                      {cmd.shortcut}
                    </kbd>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
