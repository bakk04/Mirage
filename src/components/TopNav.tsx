"use client" /* Wordmark */ /* Nav items */ /* Sliding turquoise dot */ /* Right icons */
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Settings, User } from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { useIdle } from "@/hooks/useIdle"

const NAV_ITEMS = ["Vision", "Talk", "Memory"] as const
type NavItem = typeof NAV_ITEMS[number]

const STATE_TO_NAV: Record<string, NavItem> = {
  camera: "Vision",
  understanding: "Vision",
  conversation: "Talk",
  speaking: "Talk",
  listening: "Talk",
  memory: "Memory",
  idle: "Vision",
  imagine: "Vision",
}

export default function TopNav() {
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)
  const activeItem = STATE_TO_NAV[state] ?? "Vision"
  const [visible, setVisible] = useState(true)
  const resetIdle = useIdle(() => setVisible(false), 4000)

  useEffect(() => {
    const show = () => {
      setVisible(true)
      resetIdle()
    }
    window.addEventListener("mousemove", show)
    window.addEventListener("touchstart", show)
    show()
    return () => {
      window.removeEventListener("mousemove", show)
      window.removeEventListener("touchstart", show)
    }
  }, [resetIdle])

  const handleNavClick = (item: NavItem) => {
    if (item === "Vision") setState("camera")
    else if (item === "Talk") setState("listening")
    else if (item === "Memory") setState("memory")
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6"
      animate={{ opacity: visible ? 1 : 0.15 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {}
      <motion.span
        className="text-sm font-light tracking-[0.25em] text-white/70"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{ fontWeight: 200 }}
      >
        MIRAGE
      </motion.span>

      {}
      <motion.div
        className="flex items-center gap-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => handleNavClick(item)}
            className="relative flex flex-col items-center gap-1.5 text-sm tracking-wider transition-colors duration-300 cursor-pointer"
            style={{
              fontWeight: 300,
              color:
                activeItem === item
                  ? "rgba(244,245,247,0.9)"
                  : "rgba(140,149,163,0.7)",
            }}
          >
            {item}
            {}
            <AnimatePresence>
              {activeItem === item && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-1 w-1 h-1 rounded-full"
                  style={{ background: "#5EEAD4" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </AnimatePresence>
          </button>
        ))}
      </motion.div>

      {}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <button
          aria-label="Open profile"
          className="p-2 text-white/30 hover:text-white/60 transition-colors duration-200"
        >
          <User size={16} strokeWidth={1.5} />
        </button>
        <button
          aria-label="Open settings"
          className="p-2 text-white/30 hover:text-white/60 transition-colors duration-200"
        >
          <Settings size={16} strokeWidth={1.5} />
        </button>
      </motion.div>
    </motion.nav>
  )
}
