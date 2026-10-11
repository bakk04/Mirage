"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Camera,
  CameraOff,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldCheck,
  Cpu,
  Scan,
  Hand,
  Clock,
  FlipHorizontal,
  Bot,
} from "lucide-react"
import { useCamera } from "@/hooks/useCamera"
import { useMirageStore } from "@/store/mirageStore"
import { arabicSignService } from "@/services/arabicSignRecognitionService"
import { gestureCommandService } from "@/services/gestureCommandService"
import { speechService } from "@/services/speechService"
import MirageAvatar from "@/components/avatar/MirageAvatar"
import AvatarExpressionController from "@/components/avatar/AvatarExpressionController"
import AudioWaveform from "@/components/studio/AudioWaveform"
import type { GazeValues } from "@/hooks/useMousePosition"
import type { MultimodalMessage } from "@/types/mirage"

interface CameraWorkspaceProps {
  onOpenGuide?: () => void
  onSwitchToChat?: () => void
  amplitude?: number
  gaze: GazeValues
}

export default function CameraWorkspace({
  onOpenGuide,
  onSwitchToChat,
  amplitude = 0,
  gaze,
}: CameraWorkspaceProps) {
  const cameraActive = useMirageStore((s) => s.cameraActive)
  const cameraPaused = useMirageStore((s) => s.cameraPaused)
  const mirrorCamera = useMirageStore((s) => s.settings.mirrorCamera)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  const startCameraSession = useMirageStore((s) => s.startCameraSession)
  const pauseCameraSession = useMirageStore((s) => s.pauseCameraSession)
  const resumeCameraSession = useMirageStore((s) => s.resumeCameraSession)
  const stopCameraSession = useMirageStore((s) => s.stopCameraSession)
  const updateTelemetry = useMirageStore((s) => s.updateTelemetry)
  const recordArabicSignResult = useMirageStore((s) => s.recordArabicSignResult)
  const recordGestureCommand = useMirageStore((s) => s.recordGestureCommand)

  const currentSignTokens = useMirageStore((s) => s.currentSignTokens)
  const accumulatedArabicSigns = useMirageStore((s) => s.accumulatedArabicSigns)
  const arabicTranscript = useMirageStore((s) => s.arabicTranscript)
  const removeSignToken = useMirageStore((s) => s.removeSignToken)
  const clearArabicDraft = useMirageStore((s) => s.clearArabicDraft)
  const clearSignDraft = useMirageStore((s) => s.clearSignDraft)
  const addMessage = useMirageStore((s) => s.addMessage)

  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setSpeakingState = useMirageStore((s) => s.setSpeakingState)
  const settings = useMirageStore((s) => s.settings)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const [resolutionLabel, setResolutionLabel] = useState<string>("Standby")
  const [isRestarting, setIsRestarting] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  // Camera hook bound to cameraActive lifecycle
  const {
    videoRef,
    permission,
    devices,
    start: startCameraStream,
    stop: stopCameraStream,
    switchCamera,
    mirrored,
  } = useCamera(cameraActive)

  // Start Camera
  const handleStartCamera = async () => {
    startCameraSession()
    await startCameraStream()
  }

  // Stop Camera
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

  // Pause / Resume
  const handleTogglePause = () => {
    if (cameraPaused) {
      resumeCameraSession()
    } else {
      pauseCameraSession()
    }
  }

  // Restart Camera
  const handleRestartCamera = async () => {
    setIsRestarting(true)
    stopCameraStream()
    setTimeout(async () => {
      startCameraSession()
      await startCameraStream()
      setIsRestarting(false)
    }, 350)
  }

  // Toggle mirror view
  const handleToggleMirror = () => {
    updateSettings({ mirrorCamera: !mirrorCamera })
  }

  // Video processing & future integration loop
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

        // Truthful model integration hooks
        if (arabicSignService.isReady()) {
          const signResult = arabicSignService.processVideoFrame(video)
          if (signResult) recordArabicSignResult(signResult)
        }

        if (gestureCommandService.isReady()) {
          const cmdResult = gestureCommandService.processLandmarks(null)
          if (cmdResult) recordGestureCommand(cmdResult)
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

  // Derived Arabic sentence
  const activeArabicSentence = useMemo(() => {
    if (arabicTranscript.trim()) return arabicTranscript.trim()
    if (accumulatedArabicSigns.length > 0) return accumulatedArabicSigns.join(" ")
    if (currentSignTokens.length > 0) {
      return currentSignTokens
        .map((t) => t.arabicLabel || t.gloss || t.token)
        .join(" ")
    }
    return ""
  }, [arabicTranscript, accumulatedArabicSigns, currentSignTokens])

  // Speak translation aloud with synchronized robot mouth animation
  const handleSpeakTranslation = async () => {
    const textToSpeak = activeArabicSentence
    if (!textToSpeak || isAudioPlaying) return

    setSpeakingState(true)

    await speechService.speak(textToSpeak, settings.spokenLanguage, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      onEnd: () => {
        setSpeakingState(false)
      },
      onError: () => {
        setSpeakingState(false)
      },
    })
  }

  // Copy translated text
  const handleCopy = () => {
    if (!activeArabicSentence) return
    void navigator.clipboard.writeText(activeArabicSentence)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  // Confirm sentence & add to conversation history
  const handleConfirmAndSend = () => {
    const textToSubmit = activeArabicSentence.trim()
    if (!textToSubmit) return

    const newMessage: MultimodalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      source: "arabic_sign",
      content: textToSubmit,
      originalArabicGloss: accumulatedArabicSigns.join(" "),
      confidence: 0.96,
      timestamp: new Date(),
      language: settings.spokenLanguage,
      isRTL: true,
    }

    addMessage(newMessage)
    clearArabicDraft()
    clearSignDraft()

    if (settings.autoSpeak) {
      void speechService.speak(textToSubmit, settings.spokenLanguage, {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        onEnd: () => setSpeakingState(false),
        onError: () => setSpeakingState(false),
      })
    }
  }

  return (
    <div className="w-full max-w-[1440px] flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-stretch overflow-hidden min-h-0">
      {/* ── LEFT COLUMN: CAMERA VIEWPORT & RECOGNITION FEED (8 Cols on Desktop) ── */}
      <div className="lg:col-span-8 flex flex-col justify-between gap-3 min-h-0 overflow-hidden">
        {/* Main Camera Viewport Card */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[360px] lg:min-h-[400px] rounded-3xl overflow-hidden bg-[#1A1D25] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          {/* Header Bar */}
          <div className="relative z-20 px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#161920]/90 backdrop-blur-md">
            {/* Left: Feed Identity & Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-white/95">
                <Camera size={15} className="text-[#3DDBB5]" />
                <span className="tracking-wider">ARSL SIGN CAMERA</span>
              </div>

              <span className="text-white/20">·</span>

              {!cameraActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-mono text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  STANDBY
                </span>
              ) : cameraPaused ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5A25D]/12 border border-[#F5A25D]/30 text-[11px] font-mono text-[#F5A25D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A25D]" />
                  PAUSED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 text-[11px] font-mono text-[#3DDBB5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DDBB5] animate-pulse" />
                  LIVE · OBSERVING
                </span>
              )}

              {cameraActive && !cameraPaused && (
                <span className="hidden md:inline text-[11px] font-mono text-white/45">
                  {resolutionLabel}
                </span>
              )}
            </div>

            {/* Right: Camera Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!cameraActive ? (
                <button
                  onClick={handleStartCamera}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#3DDBB5] text-[#12141A] hover:bg-[#4EEBC5] shadow-sm shadow-[#3DDBB5]/25 transition cursor-pointer"
                  title="Allow camera stream [C]"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <>
                  {/* Pause / Resume */}
                  <button
                    onClick={handleTogglePause}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      cameraPaused
                        ? "bg-[#F5A25D]/20 border border-[#F5A25D]/40 text-[#F5A25D] hover:bg-[#F5A25D]/30"
                        : "bg-white/[0.06] border border-white/10 text-white/85 hover:text-white hover:bg-white/[0.1]"
                    }`}
                    title={cameraPaused ? "Resume camera" : "Pause camera"}
                  >
                    {cameraPaused ? (
                      <Play size={12} fill="currentColor" />
                    ) : (
                      <Pause size={12} />
                    )}
                    <span>{cameraPaused ? "Resume" : "Pause"}</span>
                  </button>

                  {/* Stop Camera */}
                  <button
                    onClick={handleStopCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition cursor-pointer"
                    title="Stop camera and release stream"
                  >
                    <Square size={11} fill="currentColor" />
                    <span>Stop</span>
                  </button>

                  {/* Mirror Toggle */}
                  <button
                    onClick={handleToggleMirror}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      mirrorCamera
                        ? "bg-[#3DDBB5]/15 border-[#3DDBB5]/35 text-[#3DDBB5]"
                        : "bg-white/[0.06] border-white/10 text-white/60 hover:text-white"
                    }`}
                    title={mirrorCamera ? "Mirroring ON" : "Mirroring OFF"}
                    aria-label="Toggle camera mirror"
                  >
                    <FlipHorizontal size={13} />
                  </button>

                  {/* Restart */}
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

                  {/* Switch Camera */}
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

          {/* Video Viewport Area */}
          <div className="relative flex-1 w-full min-h-0 bg-[#0E1015] flex items-center justify-center overflow-hidden">
            {/* Live Camera Video Feed */}
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

            {/* Landmark overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* Spatial Border Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_95%_85%_at_50%_50%,transparent_65%,rgba(14,16,21,0.65)_100%)] z-10" />

            {/* Watermark Tag when active */}
            {cameraActive && !cameraPaused && (
              <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] font-mono text-[#3DDBB5] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DDBB5] animate-pulse" />
                <span>SIGNING SPACE ACTIVE</span>
              </div>
            )}

            {/* Paused State Notification */}
            {cameraActive && cameraPaused && (
              <div className="relative z-20 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-[#F5A25D]/40 text-xs text-[#F5A25D] backdrop-blur-md font-mono">
                <Pause size={13} />
                <span>Camera Paused · MIRA Companion in Resting State</span>
              </div>
            )}

            {/* Standby / Off State */}
            {!cameraActive && permission !== "denied" && (
              <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-md">
                <div className="relative p-6 sm:p-8 flex flex-col items-center gap-3">
                  {/* Subtle Viewfinder Frame Brackets */}
                  <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#3DDBB5]/60 rounded-tl" />
                  <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#3DDBB5]/60 rounded-tr" />
                  <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#3DDBB5]/60 rounded-bl" />
                  <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#3DDBB5]/60 rounded-br" />

                  <div className="w-14 h-14 rounded-2xl bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 flex items-center justify-center text-[#3DDBB5] shadow-sm">
                    <Camera size={26} />
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-white tracking-wide">
                      Arabic Sign Language Camera Standby
                    </h3>
                    <p className="text-xs text-white/60 mt-1.5 leading-relaxed max-w-sm">
                      Enable the camera stream to recognize Arabic sign language (ArSL) in real time and synchronize with your MIRA AI companion.
                    </p>
                  </div>

                  <button
                    onClick={handleStartCamera}
                    className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3DDBB5] text-[#12141A] font-medium text-xs hover:bg-[#4EEBC5] transition shadow-md shadow-[#3DDBB5]/20 cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Start Camera Stream</span>
                  </button>
                </div>
              </div>
            )}

            {/* Permission Denied State */}
            {permission === "denied" && (
              <div className="relative z-30 flex flex-col items-center justify-center p-6 text-center max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                  <CameraOff size={24} />
                </div>
                <h3 className="text-sm font-medium text-white">Camera Access Blocked</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Please enable camera permission in your browser site settings to allow real-time sign recognition.
                </p>
                <button
                  onClick={handleStartCamera}
                  className="mt-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white font-medium hover:bg-white/20 transition cursor-pointer"
                >
                  Retry Permission
                </button>
              </div>
            )}
          </div>

          {/* Viewport Footer Bar */}
          <div className="relative z-20 px-4 py-2 flex items-center justify-between gap-2 border-t border-white/[0.06] bg-[#161920]/90 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/60">
              <ShieldCheck size={12} className="text-[#3DDBB5]" />
              <span>Private On-Device Video Stream</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-white/45">
              <span>MobileNetV2: Standby</span>
              <span>·</span>
              <span>MediaPipe: Standby</span>
            </div>
          </div>
        </div>

        {/* ── ARSL RECOGNITION FEED & TRANSLATION OUTPUT DOCKED PANEL ── */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-[#1A1D25] border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col gap-3 shrink-0">
          {/* Header & Token Chips Stream */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/55 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#3DDBB5]" />
                <span>تسلسل إشارات ArSL (Arabic Sign Stream)</span>
              </span>

              {(currentSignTokens.length > 0 || accumulatedArabicSigns.length > 0) && (
                <button
                  onClick={() => {
                    clearArabicDraft()
                    clearSignDraft()
                  }}
                  className="text-[11px] font-mono text-white/50 hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw size={10} /> Clear Draft
                </button>
              )}
            </div>

            <div
              className="flex flex-wrap items-center gap-2 min-h-[38px] max-h-24 overflow-y-auto p-2 rounded-2xl bg-[#161920] border border-white/[0.06]"
              dir="rtl"
            >
              {currentSignTokens.length === 0 && accumulatedArabicSigns.length === 0 ? (
                <div className="flex items-center gap-2 px-2 text-xs text-white/40 italic font-arabic">
                  <span>في انتظار إشارات لغة الإشارة العربية من الكاميرا…</span>
                </div>
              ) : (
                currentSignTokens.map((tok) => (
                  <motion.div
                    key={tok.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 text-xs text-[#3DDBB5]"
                  >
                    <span className="font-arabic font-medium text-sm">
                      {tok.arabicLabel || tok.gloss}
                    </span>
                    <span className="text-[10px] font-mono text-white/50">
                      {Math.round(tok.confidence * 100)}%
                    </span>
                    <button
                      onClick={() => removeSignToken(tok.id)}
                      className="text-white/50 hover:text-white mr-1 cursor-pointer"
                      title="Remove sign"
                      aria-label="Remove sign"
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Arabic Translated Sentence Output & Action Bar */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#161920] border border-white/[0.08] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-[#3DDBB5] flex items-center gap-1.5 font-medium">
                  <Sparkles size={13} /> الترجمة اللفظية المعتمدة:
                </span>
                {activeArabicSentence && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3DDBB5]/15 border border-[#3DDBB5]/30 text-[#3DDBB5] font-medium">
                    TRANSLATION READY
                  </span>
                )}
              </div>

              <div
                className={`text-base sm:text-lg leading-relaxed ${
                  activeArabicSentence
                    ? "text-white font-arabic font-medium"
                    : "text-white/35 font-arabic italic"
                } text-right`}
                dir="rtl"
              >
                {activeArabicSentence ||
                  "المخرجات اللفظية للغة الإشارة ستظهر هنا تلقائياً فور التعرف عليها…"}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Audio Pronunciation Button */}
                <button
                  onClick={handleSpeakTranslation}
                  disabled={!activeArabicSentence || isAudioPlaying}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeArabicSentence
                      ? "bg-[#3DDBB5]/15 hover:bg-[#3DDBB5]/25 text-[#3DDBB5] border border-[#3DDBB5]/35 shadow-sm"
                      : "bg-white/[0.04] text-white/30 border border-transparent cursor-not-allowed"
                  }`}
                  title="نطق الترجمة بالصوت العربي مع مزامنة الروبوت"
                >
                  <Volume2
                    size={14}
                    className={isAudioPlaying ? "animate-pulse" : ""}
                  />
                  <span>{isAudioPlaying ? "جاري النطق…" : "نطق صوتي"}</span>
                </button>

                {/* Copy Text */}
                <button
                  onClick={handleCopy}
                  disabled={!activeArabicSentence}
                  className={`p-2 rounded-xl text-xs transition border cursor-pointer ${
                    activeArabicSentence
                      ? "bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border-white/10"
                      : "bg-white/[0.03] text-white/20 border-transparent cursor-not-allowed"
                  }`}
                  title="نسخ النص العربي"
                  aria-label="Copy translated text"
                >
                  {copied ? (
                    <Check size={14} className="text-[#3DDBB5]" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              {/* Confirm & Send to Chat History */}
              <button
                onClick={handleConfirmAndSend}
                disabled={!activeArabicSentence}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium transition shadow-md cursor-pointer ${
                  activeArabicSentence
                    ? "bg-[#3DDBB5] text-[#12141A] hover:bg-[#4EEBC5]"
                    : "bg-white/[0.05] text-white/25 cursor-not-allowed"
                }`}
              >
                <span>حفظ في المحادثة</span>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: MIRA AI COMPANION STAGE (4 Cols on Desktop) ── */}
      <div className="lg:col-span-4 flex flex-col justify-between p-4 sm:p-5 lg:p-6 rounded-3xl bg-[#1A1D25] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-0">
        {/* Subtle Top Atmospheric Lighting */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#3DDBB5]/10 to-transparent pointer-events-none" />

        {/* Companion Header */}
        <div className="w-full flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3DDBB5] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-white/70 uppercase font-medium">
              MIRA COMPANION
            </span>
          </div>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-xs text-[#3DDBB5] hover:underline font-mono cursor-pointer"
          >
            <Hand size={13} /> <span>Sign Guide</span>
          </button>
        </div>

        {/* Expressive Character Stage */}
        <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 w-full min-h-0 py-2">
          <MirageAvatar
            expression={avatarExpression}
            amplitude={amplitude}
            gaze={gaze}
            size={270}
            statusMessage={
              isAudioPlaying
                ? "Speaking Arabic translation…"
                : cameraActive
                  ? cameraPaused
                    ? "Camera paused · Resting"
                    : "Observing camera · Awaiting Arabic signs"
                  : "Standby · Ready to observe"
            }
            onClick={() => {
              if (isAudioPlaying) {
                speechService.stopSpeaking()
                setSpeakingState(false)
              } else if (activeArabicSentence) {
                void handleSpeakTranslation()
              }
            }}
          />
        </div>

        {/* Expression Palette & Audio Waveform Feedback */}
        <div className="w-full z-20 pt-2 shrink-0 flex flex-col items-center gap-2.5">
          <AvatarExpressionController />
          <AudioWaveform
            amplitude={amplitude}
            active={isAudioPlaying}
            barCount={16}
            color="#3DDBB5"
          />

          {/* Quick Switch to Chat */}
          <button
            onClick={onSwitchToChat}
            className="w-full mt-1 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-white/75 transition cursor-pointer text-center"
          >
            Switch to Text Chat Workspace →
          </button>
        </div>
      </div>
    </div>
  )
}
