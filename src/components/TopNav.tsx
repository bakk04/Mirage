"use client" /* ── Left: Product Identity & Subdued Status ── */ /* Refined Brand Logo Mark */ /* Discreet Companion Status Indicator */ /* ── Center: Primary Navigation Segmented Control ── */ /* Workspace 1: Sign Camera */ /* Workspace 2: Text & Voice Chat */ /* Workspace 3: Archive */ /* ── Right: Contextual Actions & Preferences ── */ /* Quick Voice Talk Action */ /* Language Pipeline Indicator Button */ /* Gesture Guide Button */ /* Diagnostics & Telemetry Button */ /* Settings & Accessibility Button */ /* Mobile Navigation Toggle */ /* ── Mobile Navigation Dropdown Sheet ── */

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Camera,
  MessageSquare,
  History,
  BookOpen,
  Activity,
  Settings,
  Globe,
  Menu,
  X,
  Volume2,
  Mic,
} from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { zIndex } from "@/lib/designSystem"

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
  const workspaceMode = useMirageStore((s) => s.workspaceMode)
  const setWorkspaceMode = useMirageStore((s) => s.setWorkspaceMode)
  const activePanel = useMirageStore((s) => s.activePanel)
  const setActivePanel = useMirageStore((s) => s.setActivePanel)
  const cameraActive = useMirageStore((s) => s.cameraActive)
  const cameraPaused = useMirageStore((s) => s.cameraPaused)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const state = useMirageStore((s) => s.state)
  const settings = useMirageStore((s) => s.settings)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isCameraMode = activePanel === "studio" && workspaceMode === "camera"
  const isChatMode = activePanel === "studio" && workspaceMode === "chat"
  const isHistoryMode = activePanel === "history"

  const handleSelectMode = (mode: "camera" | "chat") => {
    setActivePanel("studio")
    setWorkspaceMode(mode)
    setMobileMenuOpen(false)
  }

  const handleSelectHistory = () => {
    const current = useMirageStore.getState()
    if (current.cameraActive) {
      current.stopCameraSession()
    }
    setActivePanel("history")
    setMobileMenuOpen(false)
  }

  return (
    <header
      className="fixed inset-x-0 top-0 h-14 flex items-center justify-between px-3 sm:px-6 lg:px-8 bg-[#0B0D12]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-xs apple-specular-edge select-none"
      style={{ zIndex: zIndex.nav }}
      role="banner"
    >
      {}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setActivePanel("studio")
            setWorkspaceMode("camera")
          }}
          className="group flex items-center gap-2.5 text-left cursor-pointer transition focus-visible:outline-none"
          aria-label="MIRAGE AI Home"
        >
          {}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[#191F2B]/90 border border-white/[0.12] group-hover:border-[#43D9BD]/50 transition-colors shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#43D9BD] shadow-[0_0_8px_rgba(67,217,189,0.6)]" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-[0.12em] text-[#F4F7FB] group-hover:text-white transition-colors">
              MIRAGE
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#43D9BD]/12 text-[#43D9BD] border border-[#43D9BD]/30">
              AI
            </span>
          </div>
        </button>

        {}
        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-white/[0.08] text-[11px] font-mono">
          {cameraActive ? (
            cameraPaused ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F2AE75]/10 text-[#F2AE75] border border-[#F2AE75]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F2AE75]" />
                Paused
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#43D9BD]/10 text-[#43D9BD] border border-[#43D9BD]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#43D9BD] animate-pulse" />
                Live Observing
              </span>
            )
          ) : isAudioPlaying ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#43D9BD]/10 text-[#43D9BD] border border-[#43D9BD]/25">
              <Volume2 size={11} className="animate-pulse" />
              Speaking Arabic
            </span>
          ) : state === "listening" ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#43D9BD]/10 text-[#43D9BD] border border-[#43D9BD]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43D9BD] animate-pulse" />
              Listening
            </span>
          ) : (
            <span className="text-[#A1ACBC] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43D9BD]/50" />
              Ready
            </span>
          )}
        </div>
      </div>

      {}
      <nav
        className="hidden sm:flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-inner"
        aria-label="Workspace navigation"
      >
        {}
        <button
          onClick={() => handleSelectMode("camera")}
          aria-label="Vision"
          title="Sign Camera Workspace [C]"
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
            isCameraMode
              ? "text-[#F4F7FB] bg-[#191F2B] border border-white/[0.12] shadow-xs"
              : "text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.03] border border-transparent"
          }`}
          aria-pressed={isCameraMode}
        >
          <Camera
            size={13}
            className={`transition-colors ${
              isCameraMode ? "text-[#43D9BD]" : "text-[#A1ACBC]"
            }`}
          />
          <span>Sign Camera</span>
        </button>

        {}
        <button
          onClick={() => handleSelectMode("chat")}
          aria-label="Text & Voice Chat"
          title="Text & Voice Chat Workspace"
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
            isChatMode
              ? "text-[#F4F7FB] bg-[#191F2B] border border-white/[0.12] shadow-xs"
              : "text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.03] border border-transparent"
          }`}
          aria-pressed={isChatMode}
        >
          <MessageSquare
            size={13}
            className={`transition-colors ${
              isChatMode ? "text-[#43D9BD]" : "text-[#A1ACBC]"
            }`}
          />
          <span>Text & Voice Chat</span>
        </button>

        {}
        <button
          onClick={handleSelectHistory}
          aria-label="Archive"
          title="Multimodal Archive"
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
            isHistoryMode
              ? "text-[#F4F7FB] bg-[#191F2B] border border-white/[0.12] shadow-xs"
              : "text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.03] border border-transparent"
          }`}
          aria-pressed={isHistoryMode}
        >
          <History
            size={13}
            className={`transition-colors ${
              isHistoryMode ? "text-[#43D9BD]" : "text-[#A1ACBC]"
            }`}
          />
          <span>Archive</span>
        </button>
      </nav>

      {}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {}
        <button
          onClick={onTalk}
          aria-label="Talk"
          title="Voice Interaction [Space]"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#43D9BD]/14 hover:bg-[#43D9BD]/22 text-[#43D9BD] border border-[#43D9BD]/30 text-xs font-medium transition cursor-pointer active:scale-[0.98]"
        >
          <Mic size={13} />
          <span>Talk</span>
        </button>

        {}
        <button
          onClick={onOpenSettings}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer"
          title="Configure Language Pair (ArSL / Arabic)"
          aria-label="Language configuration"
        >
          <Globe size={13} className="text-[#43D9BD]" />
          <span>
            {settings.signLanguage.toUpperCase()} →{" "}
            {settings.spokenLanguage.toUpperCase()}
          </span>
        </button>

        {}
        <button
          onClick={onOpenGuide}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#A1ACBC] hover:text-[#F4F7FB] flex items-center justify-center transition cursor-pointer"
          title="Gesture Command Guide [G]"
          aria-label="Open Arabic Sign Guide"
        >
          <BookOpen size={14} />
        </button>

        {}
        <button
          onClick={onOpenDiagnostics}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#A1ACBC] hover:text-[#F4F7FB] flex items-center justify-center transition cursor-pointer"
          title="System Diagnostics & Telemetry [D]"
          aria-label="Open Diagnostics"
        >
          <Activity size={14} />
        </button>

        {}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#A1ACBC] hover:text-[#F4F7FB] flex items-center justify-center transition cursor-pointer"
          title="Settings & Accessibility"
          aria-label="Open Settings"
        >
          <Settings size={14} />
        </button>

        {}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#A1ACBC] hover:text-[#F4F7FB] flex items-center justify-center transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="sm:hidden absolute top-full inset-x-0 bg-[#10141C]/95 backdrop-blur-2xl border-b border-white/[0.10] p-3 flex flex-col gap-2 shadow-2xl z-50"
          >
            <div className="text-[10px] font-mono text-[#737F91] px-2 uppercase tracking-wider">
              Workspace Mode
            </div>

            <button
              onClick={() => handleSelectMode("camera")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isCameraMode
                  ? "bg-[#43D9BD]/14 text-[#43D9BD] border border-[#43D9BD]/30 font-semibold"
                  : "text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/5"
              }`}
            >
              <Camera size={14} />
              <span>Sign Camera Workspace</span>
            </button>

            <button
              onClick={() => handleSelectMode("chat")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isChatMode
                  ? "bg-[#43D9BD]/14 text-[#43D9BD] border border-[#43D9BD]/30 font-semibold"
                  : "text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/5"
              }`}
            >
              <MessageSquare size={14} />
              <span>Text & Voice Chat Workspace</span>
            </button>

            <button
              onClick={handleSelectHistory}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isHistoryMode
                  ? "bg-[#43D9BD]/14 text-[#43D9BD] border border-[#43D9BD]/30 font-semibold"
                  : "text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/5"
              }`}
            >
              <History size={14} />
              <span>Session History Archive</span>
            </button>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between px-2 text-xs text-[#A1ACBC]">
              <span className="font-mono">
                {settings.signLanguage.toUpperCase()} →{" "}
                {settings.spokenLanguage.toUpperCase()}
              </span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenSettings?.()
                }}
                className="text-[#43D9BD] hover:underline text-xs"
              >
                Change Pair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
