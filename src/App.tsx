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
import LiveSignRecognitionZone from "@/components/studio/LiveSignRecognitionZone"
import CommunicationZone from "@/components/studio/CommunicationZone"
import RecognitionPipelineStatus from "@/components/studio/RecognitionPipelineStatus"
import AudioWaveform from "@/components/studio/AudioWaveform"
import GestureCommandFeedback from "@/components/commands/GestureCommandFeedback"
import TechnicalDiagnosticsPanel from "@/components/diagnostics/TechnicalDiagnosticsPanel"
import GestureGuideModal from "@/components/modals/GestureGuideModal"
import SettingsModal from "@/components/modals/SettingsModal"
import ConversationTimeline from "@/components/conversation/ConversationTimeline"
import MirageOrb from "@/components/MirageOrb"
import { useMicAmplitude } from "@/hooks/useMicAmplitude"
import { useMousePosition } from "@/hooks/useMousePosition"
import { useStateLifecycle } from "@/hooks/useStateLifecycle"
import { readRuntimeMetrics } from "@/lib/runtimeMetrics"
import { zIndex } from "@/lib/designSystem"
import { Hand, Volume2 } from "lucide-react"

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
  const [mobileStudioTab, setMobileStudioTab] = useState<"avatar" | "camera" | "comm">("avatar")

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
    }
  }, [state, setAvatarExpression])

  // Global keyboard shortcuts (1-8, Space, C, G, D, ⌘K, Esc)
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

      {/* Master Communication Studio */}
      <main className="relative w-full h-full pt-16 sm:pt-20 pb-20 sm:pb-24 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-between overflow-hidden">
        {/* Pipeline Progress Header Bar */}
        <div className="w-full max-w-7xl mb-3 shrink-0">
          <RecognitionPipelineStatus />
        </div>

        {/* Mobile View Switcher (Visible on small screens) */}
        <div className="flex lg:hidden items-center gap-1 mb-2 p-1 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md z-30 shrink-0">
          <button
            onClick={() => setMobileStudioTab("avatar")}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
              mobileStudioTab === "avatar"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/50"
            }`}
          >
            Companion
          </button>
          <button
            onClick={() => setMobileStudioTab("camera")}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
              mobileStudioTab === "camera"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/50"
            }`}
          >
            Sign Camera
          </button>
          <button
            onClick={() => setMobileStudioTab("comm")}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
              mobileStudioTab === "comm"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/50"
            }`}
          >
            Transcript
          </button>
        </div>

        {/* Studio 3-Zone Workspace Composition */}
        {activePanel === "studio" && (
          <div className="w-full max-w-7xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-stretch overflow-hidden min-h-0">
            {/* ZONE A: AI COMPANION ZONE (Left Column) */}
            <div
              className={`lg:col-span-5 flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl bg-[#12141A]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl relative overflow-hidden min-h-0 ${
                mobileStudioTab !== "avatar" ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Subtle Atmospheric Top Lighting */}
              <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#5EEAD4]/10 to-transparent pointer-events-none" />

              {/* Zone Header */}
              <div className="w-full flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5EEAD4] animate-pulse" />
                  <span className="text-[11px] font-mono tracking-widest text-white/50 uppercase">
                    AI COMPANION ZONE
                  </span>
                </div>
                <button
                  onClick={() => setShowGuide(true)}
                  className="flex items-center gap-1 text-[11px] text-[#5EEAD4] hover:underline font-mono"
                >
                  <Hand size={12} /> Sign Guide
                </button>
              </div>

              {/* MIRA Expressive Character Stage */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 w-full min-h-0">
                <MirageAvatar
                  expression={avatarExpression}
                  amplitude={amplitude.get()}
                  gaze={gaze}
                  size={290}
                  statusMessage={
                    state === "listening"
                      ? "Listening to voice input…"
                      : state === "camera"
                        ? "Tracking sign kinematics…"
                        : undefined
                  }
                  onClick={() => {
                    void startMic()
                    setState(state === "listening" ? "idle" : "listening")
                  }}
                />
              </div>

              {/* Expression Palette & Waveform Feedback */}
              <div className="w-full z-20 pt-2 shrink-0 flex flex-col items-center gap-2">
                <AvatarExpressionController />
                <AudioWaveform
                  amplitude={amplitude.get()}
                  active={state === "listening" || isAudioPlaying}
                  barCount={16}
                  color={isAudioPlaying ? "#5EEAD4" : "#22D3EE"}
                />
              </div>
            </div>

            {/* RIGHT SIDE: ZONE B (Sign Recognition Camera) & ZONE C (Communication Workspace) */}
            <div
              className={`lg:col-span-7 flex flex-col gap-3 sm:gap-4 overflow-hidden h-full min-h-0 ${
                mobileStudioTab === "avatar" ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* ZONE B: LIVE SIGN RECOGNITION ZONE (Top Half) */}
              <div
                className={`w-full flex-1 min-h-[220px] max-h-[50%] overflow-hidden ${
                  mobileStudioTab === "comm" ? "hidden lg:block" : "block"
                }`}
              >
                <LiveSignRecognitionZone />
              </div>

              {/* ZONE C: COMMUNICATION ZONE (Bottom Half) */}
              <div
                className={`w-full flex-1 min-h-[240px] overflow-hidden ${
                  mobileStudioTab === "camera" ? "hidden lg:block" : "block"
                }`}
              >
                <CommunicationZone />
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

      {/* Floating Orb for Smoke Test Compatibility */}
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
        className="fixed bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none hidden sm:block"
        style={{ zIndex: zIndex.overlays }}
      >
        <p className="text-[10px] font-mono text-white/20 tracking-widest">
          1-8 States · Space: Voice · C: Camera · G: Guide · D: Diagnostics · ⌘K
        </p>
      </div>
    </div>
  )
}
