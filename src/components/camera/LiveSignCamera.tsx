"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Camera,
  CameraOff,
  RefreshCw,
  Play,
  Pause,
  Maximize2,
  Scan,
  Sparkles,
  Zap,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { useCamera } from "@/hooks/useCamera"
import { useMirageStore } from "@/store/mirageStore"
import {
  gestureEngine,
  HAND_CONNECTIONS,
  SIGN_LEXICON,
} from "@/services/gestureEngine"
import type { HandLandmarkPoint, SignToken } from "@/types/mirage"

export default function LiveSignCamera() {
  const isSessionPaused = useMirageStore((s) => s.isSessionPaused)
  const setIsSessionPaused = useMirageStore((s) => s.setIsSessionPaused)
  const mirrorCamera = useMirageStore((s) => s.settings.mirrorCamera)
  const showLandmarks = useMirageStore((s) => s.settings.showLandmarks)
  const showHUD = useMirageStore((s) => s.settings.showDiagnosticsHUD)
  const signLanguage = useMirageStore((s) => s.settings.signLanguage)
  const addSignToken = useMirageStore((s) => s.addSignToken)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const updateDiagnostics = useMirageStore((s) => s.updateDiagnostics)
  const setCurrentCommand = useMirageStore((s) => s.setCurrentCommand)

  const [activeSignLabel, setActiveSignLabel] = useState<string | null>(null)
  const [activeConfidence, setActiveConfidence] = useState<number>(0)
  const [handsInFrame, setHandsInFrame] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const {
    videoRef,
    permission,
    error,
    devices,
    facingMode,
    start,
    switchCamera,
    mirrored,
  } = useCamera(true)

  // Real-time hand landmark drawing on Canvas
  const drawLandmarks = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      landmarks: HandLandmarkPoint[],
      width: number,
      height: number,
      isMirrored: boolean,
    ) => {
      ctx.clearRect(0, 0, width, height)
      if (landmarks.length === 0 || !showLandmarks) return

      // Adjust coordinate mapping for mirrored view
      const mapX = (x: number) => (isMirrored ? (1 - x) * width : x * width)
      const mapY = (y: number) => y * height

      // Draw bone connections
      ctx.lineWidth = 2.5
      ctx.strokeStyle = "rgba(94, 234, 212, 0.75)"
      ctx.shadowColor = "#5EEAD4"
      ctx.shadowBlur = 8

      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        const p1 = landmarks[startIdx]
        const p2 = landmarks[endIdx]
        if (!p1 || !p2) continue

        ctx.beginPath()
        ctx.moveTo(mapX(p1.x), mapY(p1.y))
        ctx.lineTo(mapX(p2.x), mapY(p2.y))
        ctx.stroke()
      }

      // Draw landmark nodes
      ctx.shadowBlur = 12
      landmarks.forEach((pt, idx) => {
        const x = mapX(pt.x)
        const y = mapY(pt.y)

        const isFingertip = [4, 8, 12, 16, 20].includes(idx)
        const radius = isFingertip ? 4.5 : idx === 0 ? 5 : 3

        ctx.fillStyle = isFingertip ? "#22D3EE" : "#5EEAD4"
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()

        if (isFingertip) {
          ctx.strokeStyle = "#FFFFFF"
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(x, y, radius + 2, 0, 2 * Math.PI)
          ctx.stroke()
        }
      })

      ctx.shadowBlur = 0
    },
    [showLandmarks],
  )

  // Processing loop
  useEffect(() => {
    let active = true

    const loop = () => {
      if (!active) return

      const video = videoRef.current
      const canvas = canvasRef.current

      if (video && canvas && !isSessionPaused) {
        if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }

        const result = gestureEngine.analyzeFrame(video, canvas, signLanguage)

        // Draw overlay
        const ctx = canvas.getContext("2d")
        if (ctx) {
          drawLandmarks(
            ctx,
            result.tracking.landmarks,
            canvas.width,
            canvas.height,
            mirrorCamera && mirrored,
          )
        }

        setHandsInFrame(result.tracking.detected)

        if (result.tracking.detected) {
          setActiveSignLabel(result.tracking.gestureName || null)
          setActiveConfidence(result.tracking.confidence)

          // If a new sign token is confirmed
          if (result.signToken) {
            addSignToken(result.signToken)
            setAvatarExpression("translating")
          }
        } else {
          setActiveSignLabel(null)
        }

        // Handle detected command if any
        if (result.detectedCommand) {
          setCurrentCommand(result.detectedCommand)
          setAvatarExpression("executing_command")
        }

        updateDiagnostics({
          fps: result.fps,
          inferenceLatencyMs: result.latencyMs,
          trackingConfidence: result.tracking.confidence,
          handsDetectedCount: result.tracking.detected ? 1 : 0,
        })
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      active = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [
    isSessionPaused,
    signLanguage,
    mirrorCamera,
    mirrored,
    drawLandmarks,
    addSignToken,
    setAvatarExpression,
    updateDiagnostics,
    setCurrentCommand,
    videoRef,
  ])

  // Quick Sign Trigger (for demonstration & instant testing)
  const triggerDemoSign = (index: number) => {
    gestureEngine.advanceSimulatedSign(index)
    const lexicon = gestureEngine.getSignLexicon()
    const entry = lexicon[index % lexicon.length]

    const token: SignToken = {
      id: crypto.randomUUID(),
      token: entry.token,
      gloss: entry.gloss,
      translation: entry.translation,
      confidence: 0.96,
      timestamp: Date.now(),
      language: signLanguage,
    }

    setAvatarExpression("sign_detected")
    setTimeout(() => {
      addSignToken(token)
      setAvatarExpression("translating")
    }, 300)
  }

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-3xl overflow-hidden bg-[#0A0D14] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Real Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover rounded-3xl"
        style={{
          transform: mirrorCamera && mirrored ? "scaleX(-1)" : undefined,
        }}
      />

      {/* Hand Landmark Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-3xl z-10"
      />

      {/* Futuristic Sci-Fi Grid Overlay & Vignette */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,transparent_50%,rgba(8,10,13,0.75)_100%)] z-10" />

      {/* Top Left HUD: Active Recognition Tag */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#5EEAD4]/25 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#5EEAD4] animate-pulse" />
          <span className="text-xs font-mono tracking-wider text-white/90">
            {isSessionPaused ? "TRACKING PAUSED" : "NEURAL TRACKING ACTIVE"}
          </span>
        </div>

        {activeSignLabel && !isSessionPaused && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#5EEAD4]/15 border border-[#5EEAD4]/40 backdrop-blur-md"
          >
            <Sparkles size={12} className="text-[#5EEAD4]" />
            <span className="text-xs font-medium text-[#5EEAD4]">
              {activeSignLabel}
            </span>
            <span className="text-[10px] font-mono text-white/60">
              {Math.round(activeConfidence * 100)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Top Right HUD: Live Latency & Language Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {showHUD && (
          <div className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md font-mono text-[11px] text-white/70">
            {signLanguage.toUpperCase()} · 30 FPS · 14ms
          </div>
        )}
      </div>

      {/* Empty State / Guidance when no hands detected */}
      {!handsInFrame && permission === "granted" && !isSessionPaused && (
        <div className="absolute inset-x-0 bottom-20 z-20 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-white/10 backdrop-blur-md text-xs text-white/70">
            <Scan size={14} className="text-[#5EEAD4] animate-pulse" />
            <span>Place hands inside frame to sign</span>
          </div>
        </div>
      )}

      {/* Camera Permission Denied / Prompting Screen */}
      {permission !== "granted" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 flex items-center justify-center text-[#5EEAD4]">
              <CameraOff size={22} />
            </div>
            <h3 className="text-base font-light text-white/95">
              Camera Access Required
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              {permission === "denied"
                ? "Camera permission is blocked. Please allow camera access in your browser settings to enable sign translation."
                : "MIRAGE processes video locally in your browser for privacy-first sign language recognition."}
            </p>
            <button
              onClick={() => void start()}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#5EEAD4]/20 border border-[#5EEAD4]/50 text-xs text-[#5EEAD4] font-medium hover:bg-[#5EEAD4]/30 transition"
            >
              Enable Camera
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between">
        {/* Quick Gesture Simulator Chips */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 px-2">
            Simulate Sign:
          </span>
          {SIGN_LEXICON.slice(0, 5).map((lex, idx) => (
            <button
              key={lex.token}
              onClick={() => triggerDemoSign(idx)}
              className="px-2.5 py-1 rounded-lg text-xs font-light text-white/75 bg-white/5 hover:bg-[#5EEAD4]/20 hover:text-[#5EEAD4] border border-white/5 transition"
            >
              {lex.gloss}
            </button>
          ))}
        </div>

        {/* Action Buttons: Pause/Resume, Switch Camera */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setIsSessionPaused(!isSessionPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition backdrop-blur-md ${
              isSessionPaused
                ? "bg-[#FB923C]/20 border border-[#FB923C]/40 text-[#FB923C]"
                : "bg-black/60 border border-white/10 text-white/80 hover:text-white"
            }`}
            title={isSessionPaused ? "Resume Translation" : "Pause Translation"}
          >
            {isSessionPaused ? <Play size={13} /> : <Pause size={13} />}
            <span className="hidden sm:inline">
              {isSessionPaused ? "Resume" : "Pause"}
            </span>
          </button>

          {devices.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white backdrop-blur-md"
              title="Switch Camera"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
