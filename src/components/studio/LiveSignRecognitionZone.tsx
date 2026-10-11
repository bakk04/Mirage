"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Camera,
  CameraOff,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Hand,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scan,
  ShieldCheck,
  Cpu,
} from "lucide-react"
import { useCamera } from "@/hooks/useCamera"
import { useMirageStore } from "@/store/mirageStore"
import { arabicSignService } from "@/services/arabicSignRecognitionService"
import { gestureCommandService } from "@/services/gestureCommandService"

export default function LiveSignRecognitionZone() {
  const cameraActive = useMirageStore((s) => s.cameraActive)
  const cameraPaused = useMirageStore((s) => s.cameraPaused)
  const mirrorCamera = useMirageStore((s) => s.settings.mirrorCamera)
  const showLandmarks = useMirageStore((s) => s.settings.showLandmarks)
  const showHUD = useMirageStore((s) => s.settings.showDiagnosticsHUD)

  const mobileNetStatusLabel = useMirageStore((s) => s.mobileNetStatusLabel)
  const mediaPipeStatusLabel = useMirageStore((s) => s.mediaPipeStatusLabel)

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

  // useCamera hook is governed by cameraActive
  const {
    videoRef,
    permission,
    error,
    devices,
    facingMode,
    start: startCameraStream,
    stop: stopCameraStream,
    switchCamera,
    mirrored,
  } = useCamera(cameraActive)

  // Handle user starting camera
  const handleStartCamera = async () => {
    startCameraSession()
    await startCameraStream()
  }

  // Handle user stopping camera
  const handleStopCamera = () => {
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

  // Handle user pausing/resuming
  const handleTogglePause = () => {
    if (cameraPaused) {
      resumeCameraSession()
    } else {
      pauseCameraSession()
    }
  }

  // Handle camera restart
  const handleRestartCamera = async () => {
    setIsRestarting(true)
    stopCameraStream()
    setTimeout(async () => {
      startCameraSession()
      await startCameraStream()
      setIsRestarting(false)
    }, 300)
  }

  // Real-time video frame loop for when camera is active
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

        if (canvas) {
          if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }

          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
          }
        }

        // Future integration execution points:
        // When MobileNetV2 Arabic Sign model is integrated and ready:
        if (arabicSignService.isReady()) {
          const signResult = arabicSignService.processVideoFrame(video)
          if (signResult) {
            recordArabicSignResult(signResult)
          }
        }

        // When MediaPipe Gesture Recognizer model is integrated and ready:
        if (gestureCommandService.isReady()) {
          const cmdResult = gestureCommandService.processLandmarks(null)
          if (cmdResult) {
            recordGestureCommand(cmdResult)
          }
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
    updateTelemetry,
    recordArabicSignResult,
    recordGestureCommand,
    videoRef,
  ])

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-3xl overflow-hidden bg-[#101319] border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover rounded-3xl transition-opacity duration-500 ${
          cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${cameraPaused ? "filter grayscale-[30%] brightness-75" : ""}`}
        style={{
          transform: mirrorCamera && mirrored ? "scaleX(-1)" : undefined,
        }}
      />

      {/* Transparent Canvas for future landmark rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-3xl z-10"
      />

      {/* Subtle Spatial Vignette */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl bg-[radial-gradient(ellipse_95%_85%_at_50%_50%,transparent_50%,rgba(8,10,14,0.75)_100%)] z-10" />

      {/* Top HUD: Session Status & Truthful Model Indicators */}
      <div className="relative z-20 p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Active Camera Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 border border-white/10 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                !cameraActive
                  ? "bg-white/30"
                  : cameraPaused
                    ? "bg-[#FB923C] animate-pulse"
                    : "bg-[#5EEAD4] animate-pulse"
              }`}
            />
            <span className="text-[11px] font-mono tracking-wider text-white/90">
              {!cameraActive
                ? "CAMERA INACTIVE"
                : cameraPaused
                  ? "CAMERA PAUSED"
                  : "CAMERA ACTIVE · OBSERVING"}
            </span>
          </div>

          {/* Truthful Model Readiness Indicator: MobileNetV2 */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono backdrop-blur-md"
            title="MobileNetV2: Arabic Sign Language Recognition"
          >
            <Clock size={11} className="text-amber-400 shrink-0" />
            <span>MobileNetV2: Awaiting Arabic model integration</span>
          </div>

          {/* Truthful Model Readiness Indicator: MediaPipe */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-mono backdrop-blur-md"
            title="MediaPipe Gesture Recognizer: UI Interface Commands"
          >
            <Cpu size={11} className="text-sky-400 shrink-0" />
            <span>MediaPipe: Awaiting gesture recognizer integration</span>
          </div>
        </div>

        {/* Technical HUD Overlay (Resolution / Status) */}
        {showHUD && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-white/70 backdrop-blur-md ml-auto">
            <span>RES:</span>
            <span className="text-[#5EEAD4]">{resolutionLabel}</span>
            <span className="text-white/40">|</span>
            <span>FPS:</span>
            <span className="text-[#5EEAD4]">{cameraActive && !cameraPaused ? "30" : "0"}</span>
          </div>
        )}
      </div>

      {/* Center Display: Inactive State Overlay with Start Camera Button */}
      {!cameraActive && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 text-center my-auto">
          <div className="max-w-md flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 flex items-center justify-center text-[#5EEAD4] shadow-[0_0_24px_rgba(94,234,212,0.15)]">
              <Camera size={26} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white/95 tracking-wide">
                Arabic Sign Language Camera Stream
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mt-1">
                Start the camera stream to place MIRA into the attentive observing state. The interface will be ready to stream frames to MobileNetV2 for Arabic sign language once integrated.
              </p>
            </div>
            <button
              onClick={handleStartCamera}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5EEAD4]/20 border border-[#5EEAD4]/50 text-xs text-[#5EEAD4] font-medium hover:bg-[#5EEAD4]/30 transition shadow-lg shadow-[#5EEAD4]/10 cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>Start Camera Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* Center Display: Paused State Overlay */}
      {cameraActive && cameraPaused && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 text-center my-auto pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-[#FB923C]/30 text-xs text-[#FB923C] backdrop-blur-md">
            <Pause size={14} />
            <span>Camera Stream Paused · Avatar in Resting State</span>
          </div>
        </div>
      )}

      {/* Permission Screen (Denied / Error) */}
      {permission === "denied" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
          <div className="max-w-sm text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <CameraOff size={22} />
            </div>
            <h3 className="text-base font-medium text-white/95">
              Camera Access Blocked
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Camera permission was blocked. Please enable camera access in your browser site permissions to use live Arabic sign recognition.
            </p>
            <button
              onClick={handleStartCamera}
              className="mt-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/90 font-medium hover:bg-white/20 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="relative z-20 p-3 sm:p-3.5 flex items-center justify-between gap-2 border-t border-white/[0.04] bg-black/30 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
          <ShieldCheck size={13} className="text-[#5EEAD4]" />
          <span>Local Device Stream · Zero Cloud Upload</span>
        </div>

        {/* Action Controls: Start, Pause, Resume, Stop, Restart, Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {!cameraActive ? (
            <button
              onClick={handleStartCamera}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#5EEAD4]/20 border border-[#5EEAD4]/50 text-[#5EEAD4] hover:bg-[#5EEAD4]/30 transition backdrop-blur-md cursor-pointer"
            >
              <Play size={12} fill="currentColor" />
              <span>Start</span>
            </button>
          ) : (
            <>
              {/* Pause / Resume */}
              <button
                onClick={handleTogglePause}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition backdrop-blur-md cursor-pointer ${
                  cameraPaused
                    ? "bg-[#FB923C]/20 border border-[#FB923C]/40 text-[#FB923C] hover:bg-[#FB923C]/30"
                    : "bg-black/60 border border-white/10 text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title={cameraPaused ? "Resume camera" : "Pause camera"}
              >
                {cameraPaused ? <Play size={12} /> : <Pause size={12} />}
                <span>{cameraPaused ? "Resume" : "Pause"}</span>
              </button>

              {/* Stop Camera */}
              <button
                onClick={handleStopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition backdrop-blur-md cursor-pointer"
                title="Stop camera and release stream"
              >
                <Square size={11} fill="currentColor" />
                <span>Stop</span>
              </button>

              {/* Restart Camera */}
              <button
                onClick={handleRestartCamera}
                disabled={isRestarting}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white transition backdrop-blur-md cursor-pointer disabled:opacity-50"
                title="Restart camera stream"
              >
                <RotateCcw size={12} className={isRestarting ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Restart</span>
              </button>

              {/* Switch Camera (if multiple devices) */}
              {devices.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-1.5 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white backdrop-blur-md cursor-pointer"
                  title="Switch camera device"
                >
                  <RefreshCw size={12} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
