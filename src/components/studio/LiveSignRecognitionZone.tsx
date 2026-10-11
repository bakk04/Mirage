"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Camera,
  CameraOff,
  RefreshCw,
  Play,
  Pause,
  Scan,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Hand,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { useCamera } from "@/hooks/useCamera"
import { useMirageStore } from "@/store/mirageStore"
import {
  gestureEngine,
  HAND_CONNECTIONS,
  SIGN_LEXICON,
} from "@/services/gestureEngine"
import {
  mobileNetClassifier,
  type MobileNetPrediction,
} from "@/services/mobileNetSignClassifier"
import { mediaPipeRecognizer } from "@/services/mediaPipeGestureRecognizer"
import type { HandLandmarkPoint } from "@/types/mirage"

export default function LiveSignRecognitionZone() {
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

  const [handsInFrame, setHandsInFrame] = useState(false)
  const [activePrediction, setActivePrediction] = useState<MobileNetPrediction | null>(null)
  const [activeCommandBadge, setActiveCommandBadge] = useState<string | null>(null)

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

      const mapX = (x: number) => (isMirrored ? (1 - x) * width : x * width)
      const mapY = (y: number) => y * height

      // Draw bone connections
      ctx.lineWidth = 2
      ctx.strokeStyle = "rgba(94, 234, 212, 0.75)"
      ctx.shadowColor = "#5EEAD4"
      ctx.shadowBlur = 6

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
      ctx.shadowBlur = 10
      landmarks.forEach((pt, idx) => {
        const x = mapX(pt.x)
        const y = mapY(pt.y)

        const isFingertip = [4, 8, 12, 16, 20].includes(idx)
        const radius = isFingertip ? 4 : idx === 0 ? 5 : 2.5

        ctx.fillStyle = isFingertip ? "#22D3EE" : "#5EEAD4"
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()

        if (isFingertip) {
          ctx.strokeStyle = "#FFFFFF"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(x, y, radius + 2, 0, 2 * Math.PI)
          ctx.stroke()
        }
      })

      ctx.shadowBlur = 0
    },
    [showLandmarks],
  )

  // Camera & Model inference processing loop
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

        // Frame tracking
        const trackingResult = gestureEngine.analyzeFrame(video, canvas, signLanguage)
        const detected = trackingResult.tracking.detected
        setHandsInFrame(detected)

        // Draw overlay
        const ctx = canvas.getContext("2d")
        if (ctx) {
          drawLandmarks(
            ctx,
            trackingResult.tracking.landmarks,
            canvas.width,
            canvas.height,
            mirrorCamera && mirrored,
          )
        }

        // Run through MobileNetV2 prediction pipeline & temporal stabilization
        const rawLabel = detected ? trackingResult.tracking.gestureName?.toLowerCase() || null : null
        const rawConf = trackingResult.tracking.confidence || 0

        const { provisional, confirmedToken } = mobileNetClassifier.processFrame(
          detected,
          rawLabel,
          rawConf,
          signLanguage,
        )

        setActivePrediction(provisional)

        // If MobileNetV2 stabilized and confirmed a sign token
        if (confirmedToken) {
          addSignToken(confirmedToken)
          setAvatarExpression("translating")
        }

        // Check MediaPipe Gesture Recognizer for system commands
        if (detected && trackingResult.detectedCommand) {
          const command = mediaPipeRecognizer.evaluateGesture(
            trackingResult.detectedCommand.gestureDescription,
            trackingResult.detectedCommand.confidence,
          )

          if (command) {
            setCurrentCommand(command)
            setActiveCommandBadge(command.label)
            setAvatarExpression("executing_command")
            setTimeout(() => setActiveCommandBadge(null), 2500)
          }
        }

        updateDiagnostics({
          fps: trackingResult.fps,
          inferenceLatencyMs: trackingResult.latencyMs,
          trackingConfidence: trackingResult.tracking.confidence,
          handsDetectedCount: detected ? 1 : 0,
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

  // Quick gesture testing trigger
  const triggerDemoGesture = (idx: number) => {
    gestureEngine.advanceSimulatedSign(idx)
    const lexicon = gestureEngine.getSignLexicon()
    const entry = lexicon[idx % lexicon.length]

    setAvatarExpression("sign_detected")
    setTimeout(() => {
      addSignToken({
        id: crypto.randomUUID(),
        token: entry.token,
        gloss: entry.gloss,
        translation: entry.translation,
        confidence: 0.96,
        timestamp: Date.now(),
        language: signLanguage,
      })
      setAvatarExpression("translating")
    }, 280)
  }

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-3xl overflow-hidden bg-[#12141A] border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between">
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

      {/* Hand Landmark Skeletal Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-3xl z-10"
      />

      {/* Subtle Spatial Vignette */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl bg-[radial-gradient(ellipse_95%_85%_at_50%_50%,transparent_50%,rgba(10,13,18,0.75)_100%)] z-10" />

      {/* Top HUD: Status & MobileNetV2 Feedback */}
      <div className="relative z-20 p-3.5 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {/* Active Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                isSessionPaused
                  ? "bg-[#FB923C]"
                  : handsInFrame
                    ? "bg-[#5EEAD4] animate-pulse"
                    : "bg-white/40"
              }`}
            />
            <span className="text-[11px] font-mono tracking-wider text-white/90">
              {isSessionPaused
                ? "RECOGNITION PAUSED"
                : handsInFrame
                  ? "TRACKING HANDS"
                  : "CAMERA READY"}
            </span>
          </div>

          {/* Live MobileNetV2 Prediction Feedback */}
          {activePrediction && handsInFrame && !isSessionPaused && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#5EEAD4]/15 border border-[#5EEAD4]/35 backdrop-blur-md"
            >
              <Sparkles size={12} className="text-[#5EEAD4]" />
              <span className="text-xs font-mono font-medium text-[#5EEAD4]">
                {activePrediction.gloss}
              </span>
              <span className="text-[10px] font-mono text-white/60">
                {Math.round(activePrediction.confidence * 100)}%
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  activePrediction.isConfirmed
                    ? "bg-[#34D399]/20 text-[#34D399]"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {activePrediction.isConfirmed ? "STABLE" : "PROVISIONAL"}
              </span>
            </motion.div>
          )}

          {/* MediaPipe Gesture Command Recognized Badge */}
          {activeCommandBadge && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#FB923C]/20 border border-[#FB923C]/40 text-[#FB923C] text-xs font-mono backdrop-blur-md"
            >
              <Zap size={12} />
              <span>COMMAND: {activeCommandBadge}</span>
            </motion.div>
          )}
        </div>

        {/* Technical HUD Overlay (FPS / Latency) */}
        {showHUD && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-white/70 backdrop-blur-md">
            <span>MobileNetV2</span>
            <span className="text-[#5EEAD4]">14ms</span>
            <span>30 FPS</span>
          </div>
        )}
      </div>

      {/* Empty State / Guidance when no hands detected */}
      {!handsInFrame && permission === "granted" && !isSessionPaused && (
        <div className="relative z-20 flex justify-center pointer-events-none my-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-white/10 backdrop-blur-md text-xs text-white/70">
            <Scan size={14} className="text-[#5EEAD4] animate-pulse" />
            <span>Position hands inside frame to sign</span>
          </div>
        </div>
      )}

      {/* Permission Screen (Denied / Requesting) */}
      {permission !== "granted" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 flex items-center justify-center text-[#5EEAD4]">
              <CameraOff size={22} />
            </div>
            <h3 className="text-base font-medium text-white/95">
              Camera Access Required
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              {permission === "denied"
                ? "Camera permission is blocked. Please enable camera access in browser site settings to use real-time sign recognition."
                : "MIRAGE processes video locally in your browser for privacy-first sign translation."}
            </p>
            <button
              onClick={() => void start()}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#5EEAD4]/20 border border-[#5EEAD4]/50 text-xs text-[#5EEAD4] font-medium hover:bg-[#5EEAD4]/30 transition"
            >
              Allow Camera
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="relative z-20 p-3.5 flex items-center justify-between gap-2">
        {/* Quick Sign Simulator Chips */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 px-1.5">
            Signs:
          </span>
          {SIGN_LEXICON.slice(0, 5).map((lex, idx) => (
            <button
              key={lex.token}
              onClick={() => triggerDemoGesture(idx)}
              className="px-2 py-0.5 rounded-lg text-[11px] font-mono text-white/70 bg-white/5 hover:bg-[#5EEAD4]/20 hover:text-[#5EEAD4] border border-white/5 transition"
            >
              {lex.gloss}
            </button>
          ))}
        </div>

        {/* Action Buttons: Pause/Resume & Camera Switch */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setIsSessionPaused(!isSessionPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition backdrop-blur-md ${
              isSessionPaused
                ? "bg-[#FB923C]/20 border border-[#FB923C]/40 text-[#FB923C]"
                : "bg-black/60 border border-white/10 text-white/80 hover:text-white"
            }`}
          >
            {isSessionPaused ? <Play size={12} /> : <Pause size={12} />}
            <span>{isSessionPaused ? "Resume" : "Pause"}</span>
          </button>

          {devices.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white backdrop-blur-md"
              title="Switch camera"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
