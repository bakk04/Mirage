"use client" /* Scrim Backdrop */ /* Palette Dialog */ /* Input Row */ /* Results List */
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
              backdropFilter: "blur(16px)",
              background: "rgba(11, 13, 18, 0.7)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {}
          <motion.div
            className="fixed left-1/2 top-1/3 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 p-4"
            style={{ zIndex: zIndex.modals + 1 }}
            role="dialog"
            aria-modal="true"
            aria-label="MIRAGE command palette"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="rounded-2xl overflow-hidden apple-specular-edge"
              style={{
                background: "rgba(25, 31, 43, 0.94)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow:
                  "0 32px 80px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(67, 217, 189, 0.2)",
                backdropFilter: "blur(32px)",
              }}
            >
              {}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
                <Search
                  size={16}
                  strokeWidth={1.8}
                  className="text-[#43D9BD]"
                />
                <input
                  aria-label="Search MIRAGE commands"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask MIRAGE anything…"
                  className="flex-1 bg-transparent text-sm text-[#F4F7FB] outline-none placeholder:text-[#737F91]"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") onClose()
                    if (e.key === "Enter" && filtered[0])
                      select(filtered[0].action)
                  }}
                />
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.08] text-[#A1ACBC]">
                  esc
                </kbd>
                <button
                  className="flex h-7 w-7 items-center justify-center text-[#A1ACBC] hover:text-[#F4F7FB] rounded-lg hover:bg-white/5 transition"
                  aria-label="Close command palette"
                  title="Close command palette"
                  onClick={onClose}
                >
                  <X size={15} />
                </button>
              </div>

              {}
              <div
                className="py-1.5 max-h-72 overflow-y-auto"
                role="listbox"
                aria-label="Commands"
              >
                {filtered.map((cmd, i) => (
                  <motion.button
                    role="option"
                    aria-label={`${cmd.label}, shortcut ${cmd.shortcut}`}
                    key={cmd.action}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-left rounded-xl transition cursor-pointer text-[#F4F7FB] hover:bg-[#43D9BD]/15 hover:text-white"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => select(cmd.action)}
                  >
                    <span>{cmd.label}</span>
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-[#A1ACBC]">
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
