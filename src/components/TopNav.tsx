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
      className="fixed inset-x-0 top-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 backdrop-blur-xl bg-[#12141A]/90 border-b border-white/[0.08]"
      style={{
        zIndex: zIndex.nav,
        minHeight: sizes.navHeight,
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
      }}
      animate={{ opacity: visible ? 1 : 0.88 }}
      aria-label="Primary navigation"
    >
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.2em] text-white hover:text-white transition cursor-pointer"
          onClick={() => {
            setActivePanel("studio")
            setState("idle")
          }}
          aria-label="MIRAGE AI Home"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#3DDBB5] shadow-[0_0_10px_rgba(61,219,181,0.6)]" />
          <span>MIRAGE</span>
        </button>
        <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-widest text-[#3DDBB5] px-2.5 py-0.5 rounded-full bg-[#3DDBB5]/12 border border-[#3DDBB5]/30">
          Sign AI Companion
        </span>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5">
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
              className={`relative flex items-center px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium tracking-wide transition cursor-pointer ${
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
                  className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-[#3DDBB5]"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center gap-2">
        {/* Active Language Pipeline Pill */}
        <button
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-white/90 transition cursor-pointer"
          title="Change language pipeline"
          aria-label="Language pipeline: ArSL to Arabic"
        >
          <Globe size={13} className="text-[#3DDBB5]" />
          <span>
            {settings.signLanguage.toUpperCase()} → {settings.spokenLanguage.toUpperCase()}
          </span>
        </button>

        {/* Diagnostics Button */}
        <button
          onClick={onOpenDiagnostics}
          className="p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
          title="Model Diagnostics & Telemetry"
          aria-label="Open Diagnostics"
        >
          <Activity size={16} />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
          title="Settings & Accessibility"
          aria-label="Open Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </motion.nav>
  )
}
