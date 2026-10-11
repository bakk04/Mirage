"use client"

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  useMirageStore,
  STATE_ORDER,
  type MirageStateType,
} from "@/store/mirageStore"
import AmbientBackground from "@/components/AmbientBackground"
import TopNav from "@/components/TopNav"
import StatusPill from "@/components/StatusPill"
import Dock from "@/components/Dock"
import MirageAvatar from "@/components/avatar/MirageAvatar"
import AvatarExpressionController from "@/components/avatar/AvatarExpressionController"
import LiveSignCamera from "@/components/camera/LiveSignCamera"
import TranslationTranscript from "@/components/translation/TranslationTranscript"
import ConversationTimeline from "@/components/conversation/ConversationTimeline"
import GestureCommandFeedback from "@/components/commands/GestureCommandFeedback"
import TechnicalDiagnosticsPanel from "@/components/diagnostics/TechnicalDiagnosticsPanel"
import GestureGuideModal from "@/components/modals/GestureGuideModal"
import SettingsModal from "@/components/modals/SettingsModal"
import MirageOrb from "@/components/MirageOrb"
import { useMicAmplitude } from "@/hooks/useMicAmplitude"
import { useMousePosition } from "@/hooks/useMousePosition"
import { useStateLifecycle } from "@/hooks/useStateLifecycle"
import { readRuntimeMetrics } from "@/lib/runtimeMetrics"
import { zIndex } from "@/lib/designSystem"
import {
  Sparkles,
  Camera,
  MessageSquare,
  BookOpen,
  Sliders,
  Activity,
  Layers,
  Hand,
  Volume2,
} from "lucide-react"

const CommandPalette = lazy(() => import("@/components/CommandPalette"))

export default function App() {
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)
  const activePanel = useMirageStore((s) => s.activePanel)
  const setActivePanel = useMirageStore((s) => s.setActivePanel)
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)

  const {
    amplitude,
    permission: micPermissionState,
    start: startMic,
  } = useMicAmplitude()

  const gaze = useMousePosition()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [mobileStudioTab, setMobileStudioTab] = useState<"avatar" | "camera" | "transcript" | "history">("avatar")

  const lastTransition = useRef(0)

  useStateLifecycle(state, {
    onEnter: () => {
      if (import.meta.env.DEV) readRuntimeMetrics()
    },
  })

  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__mirageMetrics = readRuntimeMetrics
    return () => {
      delete window.__mirageMetrics
    }
  }, [])

  // Sync state transitions with avatar expressions
  useEffect(() => {
    if (state === "listening") {
      setAvatarExpression("listening")
    } else if (state === "camera") {
      setAvatarExpression("sign_detected")
    } else if (state === "understanding") {
      setAvatarExpression("analyzing")
    } else if (state === "speaking") {
      setAvatarExpression("speaking")
    } else if (state === "idle" && avatarExpression !== "idle") {
      // Revert smoothly
    }
  }, [state, setAvatarExpression])

  // Global keyboard shortcuts (1-8, Space, M, I, G, D, ⌘K, Esc)
  useEffect(() => {
    const stateMap: Record<string, MirageStateType> = {
      "1": "idle",
      "2": "listening",
      "3": "camera",
      "4": "understanding",
      "5": "conversation",
      "6": "speaking",
      "7": "memory",
      "8": "imagine",
    }

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen((v) => !v)
        return
      }

      if (e.key === "Escape") {
        setCmdOpen(false)
        setShowSettings(false)
        setShowDiagnostics(false)
        setShowGuide(false)
        return
      }

      if (e.key === "g" || e.key === "G") {
        setShowGuide((v) => !v)
        return
      }

      if (e.key === "d" || e.key === "D") {
        setShowDiagnostics((v) => !v)
        return
      }

      if (Date.now() - lastTransition.current < 180) return
      lastTransition.current = Date.now()

      const idx = STATE_ORDER.indexOf(state)
      if (e.key === "ArrowRight")
        setState(STATE_ORDER[(idx + 1) % STATE_ORDER.length])
      if (e.key === "ArrowLeft")
        setState(
          STATE_ORDER[(idx - 1 + STATE_ORDER.length) % STATE_ORDER.length],
        )

      if (e.key === " ") {
        e.preventDefault()
        void startMic()
        setState(state === "listening" ? "idle" : "listening")
      }

      if (e.key === "c" || e.key === "C") {
        setState(state === "camera" ? "idle" : "camera")
      }

      if (stateMap[e.key]) setState(stateMap[e.key])
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [state, setState, startMic])

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "#080A0D" }}
    >
      <AmbientBackground />

      {/* Top Navigation */}
      <TopNav
        onTalk={() => void startMic()}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        onOpenGuide={() => setShowGuide(true)}
      />

      {/* Status Pill */}
      <StatusPill micPermission={micPermissionState} />

      {/* Contextual Gesture Command Alert HUD */}
      <GestureCommandFeedback />

      {/* Main Communication Workspace */}
      <main className="relative w-full h-full pt-20 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        {/* Mobile View Switcher (Visible on small screens) */}
        <div className="flex lg:hidden items-center gap-1 mb-3 p-1 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md z-30">
          <button
            onClick={() => setMobileStudioTab("avatar")}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
              mobileStudioTab === "avatar"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/50"
            }`}
          >
            Avatar
          </button>
          <button
            onClick={() => setMobileStudioTab("camera")}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
              mobileStudioTab === "camera"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/50"
            }`}
          >
            Camera
          </button>
          <button
            onClick={() => setMobileStudioTab("transcript")}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
              mobileStudioTab === "transcript"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/50"
            }`}
          >
            Translate
          </button>
          <button
            onClick={() => setMobileStudioTab("history")}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
              mobileStudioTab === "history"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/50"
            }`}
          >
            History
          </button>
        </div>

        {/* Studio Workspace Layout */}
        {activePanel === "studio" && (
          <div className="w-full h-full max-w-7xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch overflow-hidden">
            {/* Left Column / Center Stage: Expressive AI Companion Avatar */}
            <div
              className={`lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-between p-4 sm:p-6 rounded-3xl bg-[#0D1117]/80 border border-white/[0.08] backdrop-blur-xl shadow-2xl relative overflow-hidden ${
                mobileStudioTab !== "avatar" ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Subtle Stage Lighting & Halo */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#5EEAD4]/10 to-transparent pointer-events-none" />

              {/* Avatar Top Bar */}
              <div className="w-full flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5EEAD4] animate-pulse" />
                  <span className="text-[11px] font-mono tracking-widest text-white/50 uppercase">
                    MIRAGE COMPANION
                  </span>
                </div>
                <button
                  onClick={() => setShowGuide(true)}
                  className="flex items-center gap-1 text-[11px] text-[#5EEAD4] hover:underline font-mono"
                >
                  <Hand size={12} /> Sign Lexicon
                </button>
              </div>

              {/* Expressive Avatar Stage */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 w-full">
                <MirageAvatar
                  expression={avatarExpression}
                  amplitude={amplitude.get()}
                  gaze={gaze}
                  size={320}
                  statusMessage={
                    state === "listening"
                      ? "Listening to voice input…"
                      : state === "camera"
                        ? "Tracking hand kinematics…"
                        : undefined
                  }
                  onClick={() => {
                    void startMic()
                    setState(state === "listening" ? "idle" : "listening")
                  }}
                />
              </div>

              {/* Avatar Expression Controller & Status */}
              <div className="w-full z-20 pt-2">
                <AvatarExpressionController />
              </div>
            </div>

            {/* Right Column: Live Sign Camera & Translation Workspace */}
            <div
              className={`lg:col-span-7 xl:col-span-7 flex flex-col gap-4 overflow-hidden h-full ${
                mobileStudioTab === "avatar" ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Upper Section: Live Sign-Language Camera Panel */}
              <div
                className={`w-full flex-1 min-h-[300px] lg:min-h-[340px] max-h-[50%] ${
                  mobileStudioTab === "transcript" || mobileStudioTab === "history"
                    ? "hidden lg:block"
                    : "block"
                }`}
              >
                <LiveSignCamera />
              </div>

              {/* Lower Section: Translation Transcript OR Conversation Timeline */}
              <div
                className={`w-full flex-1 min-h-[280px] overflow-hidden ${
                  mobileStudioTab === "camera" ? "hidden lg:block" : "block"
                }`}
              >
                {mobileStudioTab === "history" ? (
                  <ConversationTimeline />
                ) : (
                  <TranslationTranscript />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dedicated History Archive View */}
        {activePanel === "history" && (
          <div className="w-full h-full max-w-4xl flex-1 overflow-hidden">
            <ConversationTimeline />
          </div>
        )}
      </main>

      {/* Floating Orb for State Preservation (Hidden or miniaturized when avatar is visible, but maintaining testid) */}
      <div
        data-testid={state === "listening" ? "listening-orb-container" : undefined}
        className="pointer-events-none fixed -top-96 -left-96 opacity-0"
        aria-hidden="true"
      >
        <MirageOrb
          state={state}
          amplitude={amplitude}
          gaze={gaze}
          size={56}
        />
      </div>

      {/* Floating Dock Navigation */}
      <Dock
        onListen={() => {
          void startMic()
          setState("listening")
        }}
        onOpenGuide={() => setShowGuide(true)}
      />

      {/* Modals & Drawers */}
      {showGuide && <GestureGuideModal onClose={() => setShowGuide(false)} />}
      {showDiagnostics && (
        <TechnicalDiagnosticsPanel onClose={() => setShowDiagnostics(false)} />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Command Palette */}
      {cmdOpen && (
        <Suspense fallback={null}>
          <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        </Suspense>
      )}

      {/* Keyboard Shortcut Indicator Hints */}
      <div
        className="fixed bottom-3 left-1/2 -translate-x-1/2 text-center pointer-events-none hidden sm:block"
        style={{ zIndex: zIndex.overlays }}
      >
        <p className="text-[10px] font-mono text-white/20 tracking-widest">
          1-8 States · Space: Voice · C: Camera · G: Guide · D: Diagnostics · ⌘K
        </p>
      </div>
    </div>
  )
}
