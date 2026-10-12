"use client"

// Sync state transitions with avatar expressions

// Global keyboard shortcuts (1-8, Space, C, G, D, ⌘K, Esc)
/* Top Navigation */ /* Contextual Gesture Command Alert HUD */ /* Master Communication Studio Workspace */ /* Pipeline Progress Header Bar */ /* Mutually Exclusive Primary Workspace (Camera vs Chat) */ /* Dedicated History Archive View */ /* Floating Orb for Smoke Test & Media Compatibility */ /* Floating Dock Navigation - displayed when in standalone companion mode */ /* Modals & Drawers */ /* Command Palette */ /* Keyboard Shortcut Indicator Hints */ /* Top Navigation */ /* Contextual Gesture Command Alert HUD */ /* Master Communication Studio Workspace */ /* Pipeline Progress Header Bar */ /* Mutually Exclusive Primary Workspace (Camera vs Chat) */ /* Dedicated History Archive View */ /* ── Persistent Desktop & Tablet Footer ── */ /* Floating Orb for Smoke Test & Media Compatibility */ /* Floating Dock Navigation - displayed when in standalone companion mode */ /* Modals & Drawers */ /* Command Palette */ /* Floating Orb for Smoke Test & Media Compatibility */

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  useMirageStore,
  STATE_ORDER,
  type MirageStateType,
} from "@/store/mirageStore"
import AmbientBackground from "@/components/AmbientBackground"
import TopNav from "@/components/TopNav"
import Dock from "@/components/Dock"
import CameraWorkspace from "@/components/workspace/CameraWorkspace"
import ChatWorkspace from "@/components/workspace/ChatWorkspace"
import RecognitionPipelineStatus from "@/components/studio/RecognitionPipelineStatus"
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

const CommandPalette = lazy(() => import("@/components/CommandPalette"))

export default function App() {
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)
  const activePanel = useMirageStore((s) => s.activePanel)
  const setActivePanel = useMirageStore((s) => s.setActivePanel)
  const workspaceMode = useMirageStore((s) => s.workspaceMode)
  const setWorkspaceMode = useMirageStore((s) => s.setWorkspaceMode)
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const cameraActive = useMirageStore((s) => s.cameraActive)
  const cameraPaused = useMirageStore((s) => s.cameraPaused)
  const startCameraSession = useMirageStore((s) => s.startCameraSession)
  const stopCameraSession = useMirageStore((s) => s.stopCameraSession)
  const setVoiceListeningState = useMirageStore((s) => s.setVoiceListeningState)
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
  useEffect(() => {
    if (state === "listening") {
      setAvatarExpression("listening")
    } else if (state === "camera") {
      setAvatarExpression("observing")
    } else if (state === "understanding") {
      setAvatarExpression("analyzing")
    } else if (state === "speaking") {
      setAvatarExpression("speaking")
    } else if (state === "idle" && cameraActive) {
      setAvatarExpression(cameraPaused ? "paused" : "observing")
    }
  }, [state, cameraActive, cameraPaused, setAvatarExpression])
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
        if (state === "listening") {
          setVoiceListeningState(false)
          setState("idle")
        } else {
          void startMic()
          setVoiceListeningState(true)
          setState("listening")
        }
      }

      if (e.key === "c" || e.key === "C") {
        if (workspaceMode === "camera") {
          if (cameraActive) {
            stopCameraSession()
            setState("idle")
          } else {
            startCameraSession()
            setState("camera")
          }
        } else {
          setActivePanel("studio")
          setWorkspaceMode("camera")
          startCameraSession()
          setState("camera")
        }
      }

      if (stateMap[e.key]) {
        const nextState = stateMap[e.key]
        if (nextState === "camera") {
          setActivePanel("studio")
          setWorkspaceMode("camera")
        } else if (nextState === "conversation" || nextState === "listening") {
          setActivePanel("studio")
          setWorkspaceMode("chat")
        }
        setState(nextState)
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [
    state,
    setState,
    startMic,
    cameraActive,
    startCameraSession,
    stopCameraSession,
    setVoiceListeningState,
    workspaceMode,
    setWorkspaceMode,
    setActivePanel,
  ])

  return (
    <div className="relative min-h-screen w-full flex flex-col select-none bg-[#0B0D12] text-[#F4F7FB]">
      <AmbientBackground />

      {}
      <TopNav
        onTalk={() => {
          void startMic()
          setVoiceListeningState(true)
          setState("listening")
        }}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        onOpenGuide={() => setShowGuide(true)}
      />

      {}
      <GestureCommandFeedback />

      {}
      <main className="relative flex-1 w-full px-3 sm:px-6 lg:px-8 pt-2.5 pb-4 flex flex-col items-center justify-start min-h-0">
        {}
        <div className="w-full max-w-[1440px] mb-2.5 shrink-0">
          <RecognitionPipelineStatus />
        </div>

        {}
        {activePanel === "studio" && (
          <div className="w-full flex-1 flex flex-col items-center justify-start min-h-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {workspaceMode === "camera" ? (
                <motion.div
                  key="camera-mode-view"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  className="w-full flex-1 flex flex-col items-center min-h-0"
                >
                  <CameraWorkspace
                    onOpenGuide={() => setShowGuide(true)}
                    onSwitchToChat={() => {
                      stopCameraSession()
                      setWorkspaceMode("chat")
                    }}
                    amplitude={amplitude.get()}
                    gaze={gaze}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="chat-mode-view"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  className="w-full flex-1 flex flex-col items-center min-h-0"
                >
                  <ChatWorkspace
                    onOpenGuide={() => setShowGuide(true)}
                    onSwitchToCamera={() => setWorkspaceMode("camera")}
                    amplitude={amplitude.get()}
                    gaze={gaze}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {}
        {activePanel === "history" && (
          <div className="w-full flex-1 max-w-4xl flex flex-col min-h-[520px] h-[calc(100dvh-12rem)] py-1">
            <ConversationTimeline />
          </div>
        )}
      </main>

      {}
      <footer className="w-full shrink-0 border-t border-white/[0.06] bg-[#0B0D12]/90 backdrop-blur-md py-2 px-3 sm:px-6 lg:px-8 flex items-center justify-between text-[11px] font-mono text-[#737F91] select-none z-30">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43D9BD]" />
          <span>MIRAGE AI v2.4 · On-Device Neural Pipeline</span>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[#A1ACBC]/70">
          <span>1-8 States</span>
          <span>·</span>
          <span>Space: Talk</span>
          <span>·</span>
          <span>C: Camera</span>
          <span>·</span>
          <span>G: Guide</span>
          <span>·</span>
          <span>D: Diagnostics</span>
          <span>·</span>
          <span>⌘K: Commands</span>
        </div>

        <div className="text-[10px] text-[#737F91]">
          Zero-Cloud Vision Privacy
        </div>
      </footer>

      {}
      <div
        className="pointer-events-none fixed bottom-6 right-6 opacity-[0.01] z-10"
        aria-hidden="true"
      >
        <MirageOrb state={state} amplitude={amplitude} gaze={gaze} size={28} />
      </div>

      {}
      {activePanel !== "studio" && activePanel !== "history" && (
        <Dock
          onListen={() => {
            void startMic()
            setVoiceListeningState(true)
            setState("listening")
          }}
          onOpenGuide={() => setShowGuide(true)}
        />
      )}

      {}
      {showGuide && <GestureGuideModal onClose={() => setShowGuide(false)} />}
      {showDiagnostics && (
        <TechnicalDiagnosticsPanel onClose={() => setShowDiagnostics(false)} />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {}
      {cmdOpen && (
        <Suspense fallback={null}>
          <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
