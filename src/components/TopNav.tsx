"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Settings,
  User,
  Activity,
  BookOpen,
  Globe,
  Sparkles,
  Layers,
} from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { sizes, zIndex } from "@/lib/designSystem"

interface TopNavProps {
  onTalk?: () => void
  onOpenSettings?: () => void
  onOpenDiagnostics?: () => void
  onOpenGuide?: () => void
}

export default function TopNav({
  onTalk,
  onOpenSettings,
  onOpenDiagnostics,
  onOpenGuide,
}: TopNavProps) {
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)
  const activePanel = useMirageStore((s) => s.activePanel)
  const setActivePanel = useMirageStore((s) => s.setActivePanel)
  const settings = useMirageStore((s) => s.settings)

  const [visible, setVisible] = useState(true)

  // Primary navigation tabs
  const NAV_TABS = [
    { id: "studio", label: "Studio", stateTarget: "idle" as const },
    { id: "vision", label: "Vision", stateTarget: "camera" as const },
    { id: "talk", label: "Talk", stateTarget: "listening" as const },
    { id: "history", label: "History", stateTarget: "conversation" as const },
    { id: "guide", label: "Guide", stateTarget: "understanding" as const },
  ]

  const activeTabId =
    activePanel === "guide"
      ? "guide"
      : activePanel === "history"
        ? "history"
        : state === "camera"
          ? "vision"
          : state === "listening" || state === "conversation"
            ? "talk"
            : "studio"

  useEffect(() => {
    let timer: number | undefined
    const show = () => {
      setVisible(true)
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => setVisible(true), 4000)
    }
    window.addEventListener("pointermove", show)
    window.addEventListener("keydown", show)
    return () => {
      if (timer) window.clearTimeout(timer)
      window.removeEventListener("pointermove", show)
      window.removeEventListener("keydown", show)
    }
  }, [])

  return (
    <motion.nav
      className="fixed inset-x-0 top-0 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4 backdrop-blur-md bg-[#080A0D]/70 border-b border-white/[0.04]"
      style={{
        zIndex: zIndex.nav,
        minHeight: sizes.navHeight,
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
      }}
      animate={{ opacity: visible ? 1 : 0.85 }}
      aria-label="Primary navigation"
    >
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 text-sm font-light tracking-[0.25em] text-white/90 hover:text-white transition"
          onClick={() => {
            setActivePanel("studio")
            setState("idle")
          }}
          aria-label="MIRAGE AI Home"
        >
          <span className="w-2 h-2 rounded-full bg-[#5EEAD4] shadow-[0_0_8px_#5EEAD4]" />
          <span>MIRAGE</span>
        </button>
        <span className="hidden md:inline text-[10px] uppercase font-mono tracking-widest text-[#5EEAD4]/70 px-2 py-0.5 rounded-full bg-[#5EEAD4]/10 border border-[#5EEAD4]/20">
          Sign AI Companion
        </span>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2">
        {NAV_TABS.map((tab) => {
          const isActive = activeTabId === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "guide") {
                  onOpenGuide?.()
                } else if (tab.id === "history") {
                  setActivePanel("history")
                  setState(tab.stateTarget)
                } else {
                  setActivePanel("studio")
                  if (tab.id === "talk") onTalk?.()
                  setState(tab.stateTarget)
                }
              }}
              className={`relative flex items-center px-3 py-1.5 rounded-xl text-xs sm:text-sm font-light tracking-wide transition ${
                isActive
                  ? "text-white bg-white/[0.08]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="nav-glow-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-[#5EEAD4]"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Active Language Pipeline Pill */}
        <button
          onClick={onOpenSettings}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-white/80 transition"
          title="Change language pipeline"
        >
          <Globe size={12} className="text-[#5EEAD4]" />
          <span>
            {settings.signLanguage.toUpperCase()} → {settings.spokenLanguage.toUpperCase()}
          </span>
        </button>

        {/* Diagnostics Button */}
        <button
          onClick={onOpenDiagnostics}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition"
          title="Model Diagnostics & Telemetry"
          aria-label="Open Diagnostics"
        >
          <Activity size={16} />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition"
          title="Settings & Accessibility"
          aria-label="Open Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </motion.nav>
  )
}
