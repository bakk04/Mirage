"use client"

// useCamera hook is bound to cameraActive lifecycle

// Start Camera

// Stop Camera

// Pause / Resume

// Restart Camera

// Video processing & future integration loop

// Clean integration hooks for future models:
/* ── TOP HEADER BAR: Controls & Status ── */ /* Left: Zone Title & Status Dot */ /* Status Indicator */ /* Right: Camera Action Controls */ /* Pause / Resume Button */ /* Stop Camera Button */ /* Restart Camera */ /* Switch Camera (if multiple devices) */ /* ── MAIN CAMERA VIEWPORT (Spacious, Unobstructed, Proportional) ── */ /* Live Video Stream */ /* Transparent Canvas overlay for hand landmarks */ /* Subtle Spatial Vignette at borders */ /* Minimal Corner Watermark when camera is active */ /* Paused State Overlay */ /* Inactive Standby View */ /* Viewfinder corner brackets */ /* Permission Denied Notice */ /* ── BOTTOM FOOTER STRIP ── */

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Camera,
  CameraOff,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Sparkles,
  Maximize2,
  Scan,
} from "lucide-react"
import { useCamera } from "@/hooks/useCamera"
import { useMirageStore } from "@/store/mirageStore"
import { arabicSignService } from "@/services/arabicSignRecognitionService"
import { gestureCommandService } from "@/services/gestureCommandService"
import { speechQueue } from "@/services/speechService"
import type { HandLandmarkPoint } from "@/types/mirage"

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmarkPoint[],
  width: number,
  height: number,
  mirrored: boolean,
) {
  ctx.save()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = "rgba(67, 217, 189, 0.75)"
  ctx.shadowColor = "rgba(67, 217, 189, 0.5)"
  ctx.shadowBlur = 4

  for (const [i, j] of HAND_CONNECTIONS) {
    const p1 = landmarks[i]
    const p2 = landmarks[j]
    if (!p1 || !p2) continue
    const x1 = mirrored ? (1 - p1.x) * width : p1.x * width
    const y1 = p1.y * height
    const x2 = mirrored ? (1 - p2.x) * width : p2.x * width
    const y2 = p2.y * height

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  for (const p of landmarks) {
    const x = mirrored ? (1 - p.x) * width : p.x * width
    const y = p.y * height
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = "#F4F7FB"
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = "#43D9BD"
    ctx.stroke()
  }
  ctx.restore()
}

export default function LiveSignRecognitionZone() {
  const cameraActive = useMirageStore((s) => s.cameraActive)
  const cameraPaused = useMirageStore((s) => s.cameraPaused)
  const mirrorCamera = useMirageStore((s) => s.settings.mirrorCamera)
  const settings = useMirageStore((s) => s.settings)
  const setSpeakingState = useMirageStore((s) => s.setSpeakingState)

  const startCameraSession = useMirageStore((s) => s.startCameraSession)
  const pauseCameraSession = useMirageStore((s) => s.pauseCameraSession)
  const resumeCameraSession = useMirageStore((s) => s.resumeCameraSession)
  const stopCameraSession = useMirageStore((s) => s.stopCameraSession)
  const updateTelemetry = useMirageStore((s) => s.updateTelemetry)
  const recordArabicSignResult = useMirageStore((s) => s.recordArabicSignResult)
  const recordGestureCommand = useMirageStore((s) => s.recordGestureCommand)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const [resolutionLabel, setResolutionLabel] = useState<string>("Standby")
  const [isRestarting, setIsRestarting] = useState<boolean>(false)
  const latestLandmarksRef = useRef<HandLandmarkPoint[]>([])
  const frameCountRef = useRef(0)
  const lastFpsCalcRef = useRef(performance.now())
  const autoReconstructTimerRef = useRef<any>(null)

  const {
    videoRef,
    permission,
    devices,
    start: startCameraStream,
    stop: stopCameraStream,
    switchCamera,
    mirrored,
  } = useCamera(cameraActive)

  useEffect(() => {
    speechQueue.setListener((speaking) => setSpeakingState(speaking))

    const unsubArsl = arabicSignService.subscribePredictions((result) => {
      if (result.isConfirmed) {
        recordArabicSignResult(result)
        updateTelemetry({
          trackingConfidence: result.confidence,
        })
        const s = useMirageStore.getState().settings
        if (s.autoSpeak) {
          if (s.signSpeechMode === "letter") {
            const spoken = result.spokenLabel || result.arabicLabel
            speechQueue.enqueue(
              spoken,
              s.spokenLanguage || "ar",
              s.speechRate || 1.0,
              s.speechPitch || 1.0,
            )
          } else {
            // "sentence" mode: debounce sentence reconstruction upon sign pause
            if (autoReconstructTimerRef.current) {
              clearTimeout(autoReconstructTimerRef.current)
            }
            const delay = s.autoSentenceDelayMs || 1200
            autoReconstructTimerRef.current = setTimeout(() => {
              void useMirageStore.getState().reconstructArabicSentence()
            }, delay)
          }
        }
      } else if (result.isProvisional) {
        if (result.state !== "no_hand") {
          updateTelemetry({
            trackingConfidence: result.confidence,
          })
        } else {
          // Hand withdrawn: trigger sentence reconstruction promptly
          const state = useMirageStore.getState()
          if (
            state.settings.autoSpeak &&
            state.settings.signSpeechMode !== "letter" &&
            state.accumulatedArabicSigns.length > 0 &&
            !state.isReconstructingSentence
          ) {
            if (autoReconstructTimerRef.current) {
              clearTimeout(autoReconstructTimerRef.current)
            }
            autoReconstructTimerRef.current = setTimeout(() => {
              void state.reconstructArabicSentence()
            }, 650)
          }
        }
      }
    })

    const unsubLandmarks = gestureCommandService.subscribeLandmarks((lm) => {
      latestLandmarksRef.current = lm
      updateTelemetry({
        handsDetectedCount: lm.length > 0 ? 1 : 0,
      })
    })

    return () => {
      if (autoReconstructTimerRef.current) {
        clearTimeout(autoReconstructTimerRef.current)
      }
      unsubArsl()
      unsubLandmarks()
    }
  }, [recordArabicSignResult, updateTelemetry, setSpeakingState])

  const handleStartCamera = async () => {
    startCameraSession()
    await startCameraStream()
  }
  const handleStopCamera = () => {
    speechQueue.clear()
    stopCameraStream()
    stopCameraSession()
    setResolutionLabel("Standby")
    updateTelemetry({
      cameraResolution: "Off",
      fps: 0,
      trackingConfidence: 0,
      handsDetectedCount: 0,
    })
  }
  const handleTogglePause = () => {
    if (cameraPaused) {
      resumeCameraSession()
    } else {
      pauseCameraSession()
    }
  }
  const handleRestartCamera = async () => {
    setIsRestarting(true)
    stopCameraStream()
    setTimeout(async () => {
      startCameraSession()
      await startCameraStream()
      setIsRestarting(false)
    }, 350)
  }
  useEffect(() => {
    let active = true

    const loop = () => {
      if (!active) return

      const video = videoRef.current
      const canvas = canvasRef.current

      if (cameraActive && !cameraPaused && video && video.readyState >= 2) {
        if (video.videoWidth > 0 && resolutionLabel === "Standby") {
          const res = `${video.videoWidth}×${video.videoHeight}`
          setResolutionLabel(res)
          updateTelemetry({ cameraResolution: res, fps: 30 })
        }

        frameCountRef.current++
        const now = performance.now()
        if (now - lastFpsCalcRef.current >= 1000) {
          const fps = Math.round(
            (frameCountRef.current * 1000) / (now - lastFpsCalcRef.current),
          )
          updateTelemetry({ fps })
          frameCountRef.current = 0
          lastFpsCalcRef.current = now
        }

        if (canvas) {
          if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }

          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            if (
              settings.showLandmarks &&
              latestLandmarksRef.current &&
              latestLandmarksRef.current.length > 0
            ) {
              drawHandLandmarks(
                ctx,
                latestLandmarksRef.current,
                canvas.width,
                canvas.height,
                mirrorCamera,
              )
            }
          }
        }
        if (arabicSignService.isReady()) {
          arabicSignService.processVideoFrame(video)
        }

        if (
          gestureCommandService.isReady() &&
          settings.gestureCommandsEnabled
        ) {
          gestureCommandService.processVideoFrame(video)
        }
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    if (cameraActive && !cameraPaused) {
      animFrameRef.current = requestAnimationFrame(loop)
    }

    return () => {
      active = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [
    cameraActive,
    cameraPaused,
    resolutionLabel,
    mirrorCamera,
    settings.showLandmarks,
    settings.gestureCommandsEnabled,
    updateTelemetry,
    videoRef,
  ])

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[#1A1D25] border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex flex-col justify-between">
      {}
      <div className="relative z-20 px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#161920]/90 backdrop-blur-md">
        {}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-white/95">
            <Camera size={14} className="text-[#3DDBB5]" />
            <span className="hidden sm:inline tracking-wider">SIGN CAMERA</span>
            <span className="sm:hidden tracking-wider">CAMERA</span>
          </div>

          <span className="text-white/20">·</span>

          {}
          {!cameraActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-mono text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              STANDBY
            </span>
          ) : cameraPaused ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5A25D]/12 border border-[#F5A25D]/30 text-[11px] font-mono text-[#F5A25D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A25D]" />
              PAUSED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 text-[11px] font-mono text-[#3DDBB5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DDBB5] animate-pulse" />
              LIVE · OBSERVING
            </span>
          )}

          {cameraActive && !cameraPaused && (
            <span className="hidden md:inline text-[11px] font-mono text-white/50">
              {resolutionLabel} · 30 FPS
            </span>
          )}
        </div>

        {}
        <div className="flex items-center gap-2">
          {!cameraActive ? (
            <button
              onClick={handleStartCamera}
              aria-label="Allow camera"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#3DDBB5] text-[#12141A] hover:bg-[#4EEBC5] shadow-sm shadow-[#3DDBB5]/20 transition cursor-pointer font-sans"
              title="Allow camera stream [C]"
            >
              <Play size={12} fill="currentColor" />
              <span>Allow camera</span>
              <kbd className="hidden sm:inline text-[10px] px-1 py-0.2 rounded bg-black/15 text-[#12141A] font-mono">
                C
              </kbd>
            </button>
          ) : (
            <>
              {}
              <button
                onClick={handleTogglePause}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  cameraPaused
                    ? "bg-[#F5A25D]/20 border border-[#F5A25D]/40 text-[#F5A25D] hover:bg-[#F5A25D]/30"
                    : "bg-white/[0.06] border border-white/10 text-white/85 hover:text-white hover:bg-white/[0.1]"
                }`}
                title={
                  cameraPaused ? "Resume camera stream" : "Pause camera stream"
                }
              >
                {cameraPaused ? (
                  <Play size={12} fill="currentColor" />
                ) : (
                  <Pause size={12} />
                )}
                <span>{cameraPaused ? "Resume" : "Pause"}</span>
              </button>

              {}
              <button
                onClick={handleStopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/12 border border-rose-500/30 text-rose-300 hover:bg-rose-500/22 transition cursor-pointer"
                title="Stop camera and release stream"
              >
                <Square size={11} fill="currentColor" />
                <span>Stop</span>
              </button>

              {}
              <button
                onClick={handleRestartCamera}
                disabled={isRestarting}
                className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/70 hover:text-white transition cursor-pointer disabled:opacity-40"
                title="Restart camera stream"
                aria-label="Restart camera stream"
              >
                <RotateCcw
                  size={13}
                  className={isRestarting ? "animate-spin" : ""}
                />
              </button>

              {}
              {devices.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
                  title="Switch camera device"
                  aria-label="Switch camera device"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden bg-[#12141A] flex items-center justify-center">
        {}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${cameraPaused ? "filter grayscale-[30%] brightness-75" : ""}`}
          style={{
            transform: mirrorCamera && mirrored ? "scaleX(-1)" : undefined,
          }}
        />

        {}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_95%_85%_at_50%_50%,transparent_65%,rgba(18,20,26,0.6)_100%)] z-10" />

        {}
        {cameraActive && !cameraPaused && (
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] font-mono text-[#3DDBB5] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DDBB5] animate-pulse" />
            <span>LIVE FEED</span>
          </div>
        )}

        {}
        {cameraActive && cameraPaused && (
          <div className="relative z-20 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-[#F5A25D]/40 text-xs text-[#F5A25D] backdrop-blur-md font-mono">
            <Pause size={13} />
            <span>Camera Paused · MIRA Companion in Resting State</span>
          </div>
        )}

        {}
        {!cameraActive && permission !== "denied" && (
          <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-sm">
            {}
            <div className="relative p-6 sm:p-8 flex flex-col items-center gap-3">
              <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#3DDBB5]/50 rounded-tl" />
              <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#3DDBB5]/50 rounded-tr" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#3DDBB5]/50 rounded-bl" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#3DDBB5]/50 rounded-br" />

              <div className="w-12 h-12 rounded-2xl bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 flex items-center justify-center text-[#3DDBB5] shadow-sm">
                <Camera size={22} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/95 tracking-wide">
                  Sign Language Camera Standby
                </h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Start camera stream to observe hand movements and synchronize
                  with MIRA companion.
                </p>
              </div>

              <button
                onClick={handleStartCamera}
                aria-label="Allow camera"
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3DDBB5]/15 border border-[#3DDBB5]/40 text-xs text-[#3DDBB5] font-medium hover:bg-[#3DDBB5]/25 transition cursor-pointer"
              >
                <Play size={12} fill="currentColor" />
                <span>Allow camera</span>
              </button>
            </div>
          </div>
        )}

        {}
        {permission === "denied" && (
          <div className="relative z-30 flex flex-col items-center justify-center p-6 text-center max-w-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/12 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
              <CameraOff size={22} />
            </div>
            <h3 className="text-sm font-medium text-white/95">
              Camera Blocked
            </h3>
            <p className="text-xs text-white/65 mt-1 leading-relaxed">
              Enable camera permission in browser settings to start real-time
              sign recognition.
            </p>
            <button
              onClick={handleStartCamera}
              className="mt-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white/90 font-medium hover:bg-white/20 transition cursor-pointer"
            >
              Retry Access
            </button>
          </div>
        )}
      </div>

      {}
      <div className="relative z-20 px-4 py-2 flex items-center justify-between gap-2 border-t border-white/[0.06] bg-[#161920]/90 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/60">
          <ShieldCheck size={12} className="text-[#3DDBB5]" />
          <span>On-Device Video Stream</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
          <span>ArSL & Gesture Pipelines: Standby</span>
        </div>
      </div>
    </div>
  )
}
