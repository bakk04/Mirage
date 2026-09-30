"use client"

// Orb configuration per state

// Demo switcher

// Keyboard shortcuts
/* Main scene container */ /* State-specific content */ /* Floating orb — travels via layoutId */ /* Persistent chrome */ /* Demo switcher */ /* Command palette */ /* Keyboard hints */

import { lazy, Suspense, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  useMirageStore,
  STATE_ORDER,
  type MirageStateType,
} from "@/store/mirageStore"
import AmbientBackground from "@/components/AmbientBackground"
import MirageOrb from "@/components/MirageOrb"
import TopNav from "@/components/TopNav"
import StatusPill from "@/components/StatusPill"
import Dock from "@/components/Dock"
import { useMicAmplitude } from "@/hooks/useMicAmplitude"
import { useMousePosition } from "@/hooks/useMousePosition"

const IdleState = lazy(() => import("@/components/states/IdleState"))
const ListeningState = lazy(() => import("@/components/states/ListeningState"))
const CameraState = lazy(() => import("@/components/states/CameraState"))
const UnderstandingState = lazy(
  () => import("@/components/states/UnderstandingState"),
)
const ConversationState = lazy(
  () => import("@/components/states/ConversationState"),
)
const SpeakingState = lazy(() => import("@/components/states/SpeakingState"))
const MemoryState = lazy(() => import("@/components/states/MemoryState"))
const ImagineState = lazy(() => import("@/components/states/ImagineState"))
const CommandPalette = lazy(() => import("@/components/CommandPalette"))
const ORB_CONFIG: Record<MirageStateType, {
  size: number
  position: "center" | "bottom-left"
  show: boolean
}> = {
  idle: { size: 240, position: "center", show: true },
  listening: { size: 240, position: "center", show: true },
  camera: { size: 56, position: "bottom-left", show: true },
  understanding: { size: 56, position: "bottom-left", show: true },
  conversation: { size: 56, position: "bottom-left", show: true },
  speaking: { size: 240, position: "center", show: true },
  memory: { size: 56, position: "bottom-left", show: true },
  imagine: { size: 56, position: "bottom-left", show: true },
}
function DemoSwitcher({ onClose }: { onClose: () => void }) {
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)
  const labels: [string, MirageStateType][] = [
    ["1 Idle", "idle"],
    ["2 Listen", "listening"],
    ["3 Camera", "camera"],
    ["4 Analyze", "understanding"],
    ["5 Chat", "conversation"],
    ["6 Speak", "speaking"],
    ["7 Memory", "memory"],
    ["8 Imagine", "imagine"],
  ]
  return (
    <motion.div
      className="fixed top-20 right-4 z-[60] flex flex-col gap-1 p-2 rounded-2xl"
      style={{
        background: "rgba(17,21,26,0.8)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {labels.map(([label, s]) => (
        <button
          key={s}
          onClick={() => setState(s)}
          className="px-3 py-1.5 rounded-lg text-left text-xs transition-all duration-200 tracking-wider"
          style={{
            fontWeight: 300,
            color: state === s ? "#5EEAD4" : "rgba(140,149,163,0.6)",
            background: state === s ? "rgba(94,234,212,0.08)" : "transparent",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </button>
      ))}
    </motion.div>
  )
}

export default function App() {
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)

  const { amplitude, start: startMic } = useMicAmplitude()
  const gaze = useMousePosition()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [showDemoSwitcher] = useState(true)
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
        return
      }

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
      if (e.key === "m" || e.key === "M")
        setState(state === "memory" ? "idle" : "memory")
      if (e.key === "i" || e.key === "I")
        setState(state === "imagine" ? "camera" : "imagine")
      if (stateMap[e.key]) setState(stateMap[e.key])
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [state, setState, startMic])

  const orbConfig = ORB_CONFIG[state]
  const isCentered = orbConfig.position === "center"

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#080A0D" }}
    >
      <AmbientBackground />

      {}
      <div className="relative w-full h-full">
        {}
        <Suspense
          fallback={<div className="absolute inset-0" aria-hidden="true" />}
        >
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="idle"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <IdleState />
              </motion.div>
            )}

            {state === "listening" && (
              <motion.div
                key="listening"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <ListeningState amplitude={amplitude} />
              </motion.div>
            )}

            {state === "camera" && (
              <motion.div
                key="camera"
                className="absolute inset-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <CameraState />
              </motion.div>
            )}

            {state === "understanding" && (
              <motion.div
                key="understanding"
                className="absolute inset-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <UnderstandingState />
              </motion.div>
            )}

            {state === "conversation" && (
              <motion.div
                key="conversation"
                className="absolute inset-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <ConversationState />
              </motion.div>
            )}

            {state === "speaking" && (
              <motion.div
                key="speaking"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <SpeakingState amplitude={amplitude} />
              </motion.div>
            )}

            {state === "memory" && (
              <motion.div
                key="memory"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <MemoryState />
              </motion.div>
            )}

            {state === "imagine" && (
              <motion.div
                key="imagine"
                className="absolute inset-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
              >
                <ImagineState />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>

        {}
        <motion.div
          className="absolute z-20"
          animate={
            isCentered
              ? {
                  left: "50%",
                  top: state === "idle" ? "35%" : "50%",
                  x: "-50%",
                  y: "-50%",
                  width: orbConfig.size,
                  height: orbConfig.size,
                }
              : {
                  left: 32,
                  bottom: 100,
                  top: "auto",
                  x: 0,
                  y: 0,
                  width: orbConfig.size,
                  height: orbConfig.size,
                }
          }
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ position: "fixed" }}
        >
          <MirageOrb
            state={state}
            amplitude={amplitude}
            gaze={gaze}
            size={orbConfig.size}
            onClick={() => {
              void startMic()
              if (state === "idle" || state === "speaking")
                setState("listening")
            }}
            onLongPress={() => {
              void startMic()
              setState("listening")
            }}
          />
        </motion.div>
      </div>

      {}
      <TopNav />
      <StatusPill />
      <Dock />

      {}
      {showDemoSwitcher && <DemoSwitcher onClose={() => {}} />}

      {}
      {cmdOpen && (
        <Suspense fallback={null}>
          <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        </Suspense>
      )}

      {}
      <motion.div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 200,
            color: "rgba(140,149,163,0.3)",
            letterSpacing: "0.12em",
          }}
        >
          1-8 · ← → · Space · M · I · ⌘K
        </p>
      </motion.div>
    </div>
  )
}
