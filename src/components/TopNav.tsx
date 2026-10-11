"use client"

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
  Sparkles,
  Menu,
  X,
  Volume2,
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
    // If leaving camera for history, stop camera safely
    const current = useMirageStore.getState()
    if (current.cameraActive) {
      current.stopCameraSession()
    }
    setActivePanel("history")
    setMobileMenuOpen(false)
  }

  return (
    <header
      className="fixed inset-x-0 top-0 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 bg-[#12141A]/85 backdrop-blur-xl border-b border-white/[0.08]"
      style={{ zIndex: zIndex.nav }}
      role="banner"
    >
      {/* ── Left: Brand Identity ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setActivePanel("studio")
            setWorkspaceMode("camera")
          }}
          className="group flex items-center gap-2.5 text-left cursor-pointer transition focus:outline-none"
          aria-label="MIRAGE AI Home"
        >
          {/* Refined emblem with soft radial halo */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#3DDBB5]/25 via-[#1A1D25] to-[#12141A] border border-[#3DDBB5]/35 shadow-sm shadow-[#3DDBB5]/10 group-hover:border-[#3DDBB5]/60 transition">
            <span className="w-2 h-2 rounded-full bg-[#3DDBB5] shadow-[0_0_8px_rgba(61,219,181,0.9)]" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-[0.16em] text-white">
              MIRAGE
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-md bg-[#3DDBB5]/15 text-[#3DDBB5] border border-[#3DDBB5]/30">
              AI
            </span>
          </div>
        </button>

        {/* Status Indicator Pill */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/10 text-[11px] font-mono">
          {cameraActive ? (
            cameraPaused ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F5A25D]/12 border border-[#F5A25D]/30 text-[#F5A25D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5A25D]" />
                Camera Paused
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 text-[#3DDBB5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DDBB5] animate-pulse" />
                Live Feed
              </span>
            )
          ) : isAudioPlaying ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 text-[#3DDBB5]">
              <Volume2 size={11} className="animate-pulse" />
              Speaking Arabic
            </span>
          ) : state === "listening" ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/12 border border-sky-500/30 text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Listening
            </span>
          ) : (
            <span className="text-white/45">Companion Ready</span>
          )}
        </div>
      </div>

      {/* ── Center: Primary Mutually Exclusive Workspace Switcher ── */}
      <nav
        className="hidden sm:flex items-center p-1 rounded-2xl bg-[#161920]/90 border border-white/[0.08] shadow-inner"
        aria-label="Workspace modes"
      >
        {/* Mode 1: Camera & Sign Recognition */}
        <button
          onClick={() => handleSelectMode("camera")}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            isCameraMode
              ? "text-white"
              : "text-white/60 hover:text-white hover:bg-white/[0.03]"
          }`}
          aria-pressed={isCameraMode}
        >
          {isCameraMode && (
            <motion.div
              layoutId="top-nav-active-pill"
              className="absolute inset-0 rounded-xl bg-white/[0.1] border border-white/[0.12] shadow-sm"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <Camera
            size={14}
            className={`relative z-10 ${
              isCameraMode ? "text-[#3DDBB5]" : "text-white/60"
            }`}
          />
          <span className="relative z-10">Sign Camera</span>
        </button>

        {/* Mode 2: Conversation & Chat */}
        <button
          onClick={() => handleSelectMode("chat")}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            isChatMode
              ? "text-white"
              : "text-white/60 hover:text-white hover:bg-white/[0.03]"
          }`}
          aria-pressed={isChatMode}
        >
          {isChatMode && (
            <motion.div
              layoutId="top-nav-active-pill"
              className="absolute inset-0 rounded-xl bg-white/[0.1] border border-white/[0.12] shadow-sm"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <MessageSquare
            size={14}
            className={`relative z-10 ${
              isChatMode ? "text-[#3DDBB5]" : "text-white/60"
            }`}
          />
          <span className="relative z-10">Text & Voice Chat</span>
        </button>

        {/* Archive / History */}
        <button
          onClick={handleSelectHistory}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            isHistoryMode
              ? "text-white"
              : "text-white/50 hover:text-white hover:bg-white/[0.03]"
          }`}
          aria-pressed={isHistoryMode}
        >
          {isHistoryMode && (
            <motion.div
              layoutId="top-nav-active-pill"
              className="absolute inset-0 rounded-xl bg-white/[0.1] border border-white/[0.12] shadow-sm"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <History
            size={13}
            className={`relative z-10 ${
              isHistoryMode ? "text-[#3DDBB5]" : "text-white/50"
            }`}
          />
          <span className="relative z-10">Archive</span>
        </button>
      </nav>

      {/* ── Right: Language Pipeline & Tools ── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language Pipeline Indicator */}
        <button
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-white/85 transition cursor-pointer"
          title="Configure Language Pair"
          aria-label="Language configuration"
        >
          <Globe size={13} className="text-[#3DDBB5]" />
          <span>
            {settings.signLanguage.toUpperCase()} → {settings.spokenLanguage.toUpperCase()}
          </span>
        </button>

        {/* Sign Guide Trigger */}
        <button
          onClick={onOpenGuide}
          className="p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          title="Arabic Sign Guide [G]"
          aria-label="Open Arabic Sign Guide"
        >
          <BookOpen size={16} />
        </button>

        {/* System Diagnostics Trigger */}
        <button
          onClick={onOpenDiagnostics}
          className="p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          title="Model Diagnostics & Telemetry [D]"
          aria-label="Open Diagnostics"
        >
          <Activity size={16} />
        </button>

        {/* Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          title="Settings & Accessibility"
          aria-label="Open Settings"
        >
          <Settings size={16} />
        </button>

        {/* Mobile Hamburger Toggle (Small screens) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 rounded-xl text-white/75 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Mobile Navigation Dropdown Sheet ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden absolute top-full inset-x-0 bg-[#161920]/95 backdrop-blur-2xl border-b border-white/[0.1] p-3 flex flex-col gap-2 shadow-2xl z-50"
          >
            <div className="text-[11px] font-mono text-white/45 px-2 uppercase tracking-wider">
              Workspace Mode
            </div>

            <button
              onClick={() => handleSelectMode("camera")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isCameraMode
                  ? "bg-[#3DDBB5]/15 text-[#3DDBB5] border border-[#3DDBB5]/30 font-medium"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              <Camera size={14} />
              <span>Sign Camera Workspace</span>
            </button>

            <button
              onClick={() => handleSelectMode("chat")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isChatMode
                  ? "bg-[#3DDBB5]/15 text-[#3DDBB5] border border-[#3DDBB5]/30 font-medium"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              <MessageSquare size={14} />
              <span>Text & Voice Chat Workspace</span>
            </button>

            <button
              onClick={handleSelectHistory}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isHistoryMode
                  ? "bg-[#3DDBB5]/15 text-[#3DDBB5] border border-[#3DDBB5]/30 font-medium"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              <History size={14} />
              <span>Session History Archive</span>
            </button>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between px-2 text-xs text-white/60">
              <span className="font-mono">
                {settings.signLanguage.toUpperCase()} → {settings.spokenLanguage.toUpperCase()}
              </span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenSettings?.()
                }}
                className="text-[#3DDBB5] underline text-xs"
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
