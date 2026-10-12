"use client"

// Camera hook bound to cameraActive lifecycle

// Start Camera

// Stop Camera

// Pause / Resume

// Restart Camera

// Toggle mirror view

// Video processing & truthful model integration loop

// Truthful model integration hooks

// Derived Arabic sentence

// Speak translation aloud with synchronized robot mouth animation

// Copy translated text

// Confirm sentence & add to conversation history
/* ── LEFT COLUMN: CAMERA VIEWPORT & RECOGNITION FEED (8 Cols on Desktop) ── */ /* Main Camera Viewport Card (Apple Liquid Glass) */ /* Header Bar */ /* Left: Feed Identity & Live State */ /* Right: Camera Action Controls */ /* Pause / Resume */ /* Stop Camera */ /* Mirror Toggle */ /* Restart */ /* Switch Camera */ /* Video Viewport Area */ /* Live Camera Video Feed */ /* Landmark overlay canvas */ /* Spatial Border Vignette */ /* Watermark Tag when active */ /* Paused State Notification */ /* Standby / Off State */ /* Permission Denied State */ /* Viewport Footer Bar */ /* ── ARSL RECOGNITION FEED & TRANSLATION OUTPUT PANEL (Apple Liquid Glass) ── */ /* Header & Token Chips Stream */ /* Arabic Translated Sentence Output & Action Bar */ /* Bottom Actions */ /* Audio Pronunciation Button */ /* Copy Text */ /* Confirm & Send to Chat History */ /* ── RIGHT COLUMN: MIRA AI COMPANION STAGE (4 Cols on Desktop) ── */ /* Subtle Top Ambient Accent Light */ /* Companion Header */ /* Expressive Character Stage (Appropriately sized so it doesn't crowd) */ /* Expression Palette & Waveform Feedback */ /* Contextual Link to Chat Workspace */

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
  Hand,
  Clock,
  FlipHorizontal,
  Bot,
  MessageSquare,
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
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setSpeakingState = useMirageStore((s) => s.setSpeakingState)
  const settings = useMirageStore((s) => s.settings)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const [resolutionLabel, setResolutionLabel] = useState<string>("Standby")
  const [isRestarting, setIsRestarting] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const {
    videoRef,
    permission,
    devices,
    start: startCameraStream,
    stop: stopCameraStream,
    switchCamera,
    mirrored,
  } = useCamera(cameraActive)
  const handleStartCamera = async () => {
    startCameraSession()
    await startCameraStream()
  }
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
  const handleToggleMirror = () => {
    updateSettings({ mirrorCamera: !mirrorCamera })
  }
  useEffect(() => {
    let active = true

    const loop = () => {
      if (!active) return

      const video = videoRef.current
      const canvas = canvasRef.current

      if (
        cameraActive &&
        !cameraPaused &&
        video &&
        video.readyState >=
          2
      ) {
        if (
          video.videoWidth >
            0 &&
          resolutionLabel ===
            "Standby"
        ) {
          const res = `${video.videoWidth}×${video.videoHeight}`
          setResolutionLabel(res)
          updateTelemetry({ cameraResolution: res, fps: 30 })
        }

        if (canvas) {
          if (
            canvas.width !==
              video.videoWidth &&
            video.videoWidth >
              0
          ) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }

          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
          }
        }
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
  const activeArabicSentence = useMemo(() => {
    if (arabicTranscript.trim()) return arabicTranscript.trim()
    if (
      accumulatedArabicSigns.length >
      0
    )
      return accumulatedArabicSigns.join(" ")
    if (
      currentSignTokens.length >
      0
    ) {
      return currentSignTokens
        .map((t) => t.arabicLabel || t.gloss || t.token)
        .join(" ")
    }
    return ""
  }, [arabicTranscript, accumulatedArabicSigns, currentSignTokens])
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
  const handleCopy = () => {
    if (!activeArabicSentence) return
    void navigator.clipboard.writeText(activeArabicSentence)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
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
    <div className="w-full max-w-[1440px] h-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch min-h-0 overflow-y-auto lg:overflow-hidden select-none">
      {}
      <div className="lg:col-span-8 flex flex-col gap-3 min-h-0 overflow-hidden">
        {}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[300px] lg:min-h-[340px] rounded-2xl overflow-hidden bg-[#10141C]/85 backdrop-blur-xl border border-white/[0.10] shadow-sm flex flex-col justify-between apple-specular-edge">
          {}
          <div className="relative z-20 px-3.5 py-2 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#10141C]/90 backdrop-blur-md">
            {}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#F4F7FB]">
                <Camera size={14} className="text-[#43D9BD]" />
                <span className="tracking-wider">ARSL SIGN CAMERA</span>
              </div>

              <span className="text-white/20">·</span>

              {!cameraActive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-[#A1ACBC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  STANDBY
                </span>
              ) : cameraPaused ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F2AE75]/12 border border-[#F2AE75]/30 text-[11px] font-mono text-[#F2AE75]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F2AE75]" />
                  PAUSED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#43D9BD]/12 border border-[#43D9BD]/30 text-[11px] font-mono text-[#43D9BD]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#43D9BD] animate-pulse" />
                  LIVE · OBSERVING
                </span>
              )}

              {cameraActive && !cameraPaused && (
                <span className="hidden md:inline text-[11px] font-mono text-[#A1ACBC]/70">
                  {resolutionLabel}
                </span>
              )}
            </div>

            {}
            <div className="flex items-center gap-1.5">
              {!cameraActive ? (
                <button
                  onClick={handleStartCamera}
                  aria-label="Allow camera"
                  title="Start camera stream [C]"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#43D9BD] hover:bg-[#34C7A8] text-[#0B0D12] shadow-xs transition cursor-pointer active:scale-[0.98]"
                >
                  <Play size={11} fill="currentColor" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <>
                  {}
                  <button
                    onClick={handleTogglePause}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      cameraPaused
                        ? "bg-[#F2AE75]/14 border border-[#F2AE75]/30 text-[#F2AE75] hover:bg-[#F2AE75]/20"
                        : "bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.10] text-[#F4F7FB]"
                    }`}
                    title={cameraPaused ? "Resume camera" : "Pause camera"}
                  >
                    {cameraPaused ? (
                      <Play size={11} fill="currentColor" />
                    ) : (
                      <Pause size={11} />
                    )}
                    <span>{cameraPaused ? "Resume" : "Pause"}</span>
                  </button>

                  {}
                  <button
                    onClick={handleStopCamera}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 transition cursor-pointer"
                    title="Stop camera session"
                  >
                    <Square size={10} fill="currentColor" />
                    <span>Stop</span>
                  </button>

                  {}
                  <button
                    onClick={handleToggleMirror}
                    className={`w-7 h-7 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                      mirrorCamera
                        ? "bg-[#43D9BD]/14 border-[#43D9BD]/40 text-[#43D9BD]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#A1ACBC] hover:text-[#F4F7FB]"
                    }`}
                    title={mirrorCamera ? "Mirroring ON" : "Mirroring OFF"}
                    aria-label="Toggle camera mirror"
                  >
                    <FlipHorizontal size={12} />
                  </button>

                  {}
                  <button
                    onClick={handleRestartCamera}
                    disabled={isRestarting}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer flex items-center justify-center disabled:opacity-40"
                    title="Restart camera stream"
                    aria-label="Restart camera stream"
                  >
                    <RotateCcw
                      size={12}
                      className={isRestarting ? "animate-spin" : ""}
                    />
                  </button>

                  {}
                  {devices.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer flex items-center justify-center"
                      title="Switch camera device"
                      aria-label="Switch camera device"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {}
          <div className="relative flex-1 w-full min-h-0 bg-[#0B0D12] flex items-center justify-center overflow-hidden">
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
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_95%_85%_at_50%_50%,transparent_65%,rgba(11,13,18,0.7)_100%)] z-10" />

            {}
            {cameraActive && !cameraPaused && (
              <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0B0D12]/85 border border-white/[0.10] text-[11px] font-mono text-[#43D9BD] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#43D9BD] animate-pulse" />
                <span>SIGNING SPACE ACTIVE</span>
              </div>
            )}

            {}
            {cameraActive && cameraPaused && (
              <div className="relative z-20 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0B0D12]/90 border border-[#F2AE75]/30 text-xs text-[#F2AE75] backdrop-blur-md font-mono">
                <Pause size={13} />
                <span>Camera Paused · MIRA Companion in Resting State</span>
              </div>
            )}

            {}
            {!cameraActive && permission !== "denied" && (
              <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-md">
                <div className="relative p-5 sm:p-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.10] flex items-center justify-center text-[#43D9BD] shadow-xs">
                    <Camera size={22} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#F4F7FB] tracking-wide">
                      Arabic Sign Language Camera Standby
                    </h3>
                    <p className="text-xs text-[#A1ACBC] mt-1.5 leading-relaxed max-w-sm">
                      Enable your camera stream to recognize Arabic sign
                      language (ArSL) in real time and converse with your MIRA
                      AI companion.
                    </p>
                  </div>

                  <button
                    onClick={handleStartCamera}
                    aria-label="Allow camera"
                    className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#43D9BD] hover:bg-[#34C7A8] text-[#0B0D12] font-semibold text-xs transition shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Start Camera Stream</span>
                  </button>
                </div>
              </div>
            )}

            {}
            {permission === "denied" && (
              <div className="relative z-30 flex flex-col items-center justify-center p-6 text-center max-w-sm">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-3">
                  <CameraOff size={22} />
                </div>
                <h3 className="text-sm font-semibold text-[#F4F7FB]">
                  Camera Access Blocked
                </h3>
                <p className="text-xs text-[#A1ACBC] mt-1 leading-relaxed">
                  Please enable camera permission in your browser site settings
                  to allow real-time sign recognition.
                </p>
                <button
                  onClick={handleStartCamera}
                  aria-label="Allow camera"
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.10] text-xs text-[#F4F7FB] font-medium hover:bg-white/[0.09] transition cursor-pointer"
                >
                  Retry Permission
                </button>
              </div>
            )}
          </div>

          {}
          <div className="relative z-20 px-3.5 py-1.5 flex items-center justify-between gap-2 border-t border-white/[0.08] bg-[#10141C]/90 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A1ACBC]">
              <ShieldCheck size={12} className="text-[#43D9BD]" />
              <span>Private On-Device Video Stream</span>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#A1ACBC]/60">
              <span>MobileNetV2: Standby</span>
              <span>·</span>
              <span>MediaPipe: Standby</span>
            </div>
          </div>
        </div>

        {}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#191F2B]/75 backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.45)] apple-specular-edge flex flex-col gap-2.5 shrink-0">
          {}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1ACBC] flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45B9F5] shadow-[0_0_6px_rgba(69,185,245,0.8)]" />
                <span>تسلسل إشارات ArSL (Arabic Sign Stream)</span>
              </span>

              {(currentSignTokens.length > 0 ||
                accumulatedArabicSigns.length > 0) && (
                <button
                  onClick={() => {
                    clearArabicDraft()
                    clearSignDraft()
                  }}
                  className="text-[11px] font-mono text-[#A1ACBC] hover:text-[#F4F7FB] flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw size={10} /> Clear Draft
                </button>
              )}
            </div>

            <div
              className="flex flex-wrap items-center gap-1.5 min-h-[34px] max-h-20 overflow-y-auto p-1.5 rounded-xl bg-[#0B0D12]/60 border border-white/[0.06]"
              dir="rtl"
            >
              {currentSignTokens.length === 0 &&
              accumulatedArabicSigns.length === 0 ? (
                <div className="flex items-center gap-2 px-2 text-xs text-[#737F91] italic font-arabic">
                  <span>في انتظار إشارات لغة الإشارة العربية من الكاميرا…</span>
                </div>
              ) : (
                currentSignTokens.map((tok) => (
                  <motion.div
                    key={tok.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#45B9F5]/14 border border-[#45B9F5]/30 text-xs text-[#45B9F5]"
                  >
                    <span className="font-arabic font-medium text-xs">
                      {tok.arabicLabel || tok.gloss}
                    </span>
                    <span className="text-[10px] font-mono text-[#A1ACBC]/80">
                      {Math.round(tok.confidence * 100)}%
                    </span>
                    <button
                      onClick={() => removeSignToken(tok.id)}
                      className="text-[#A1ACBC] hover:text-white mr-0.5 cursor-pointer"
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

          {}
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08] flex flex-col justify-between gap-2 shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase tracking-wider text-[#43D9BD] flex items-center gap-1.5 font-semibold">
                  <Sparkles size={12} /> الترجمة اللفظية المعتمدة:
                </span>
                {activeArabicSentence && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#43D9BD]/15 border border-[#43D9BD]/35 text-[#43D9BD] font-medium">
                    TRANSLATION READY
                  </span>
                )}
              </div>

              <div
                className={`text-sm sm:text-base leading-relaxed ${
                  activeArabicSentence
                    ? "text-[#F4F7FB] font-arabic font-medium"
                    : "text-[#737F91] font-arabic italic"
                } text-right`}
                dir="rtl"
              >
                {activeArabicSentence ||
                  "المخرجات اللفظية للغة الإشارة ستظهر هنا تلقائياً فور التعرف عليها…"}
              </div>
            </div>

            {}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {}
                <button
                  onClick={handleSpeakTranslation}
                  disabled={!activeArabicSentence || isAudioPlaying}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeArabicSentence
                      ? "bg-[#43D9BD]/14 hover:bg-[#43D9BD]/22 text-[#43D9BD] border border-[#43D9BD]/35 shadow-xs"
                      : "bg-white/[0.04] text-white/30 border border-transparent cursor-not-allowed"
                  }`}
                  title="نطق الترجمة بالصوت العربي مع مزامنة الرفيق"
                >
                  <Volume2
                    size={13}
                    className={isAudioPlaying ? "animate-pulse" : ""}
                  />
                  <span>{isAudioPlaying ? "جاري النطق…" : "نطق صوتي"}</span>
                </button>

                {}
                <button
                  onClick={handleCopy}
                  disabled={!activeArabicSentence}
                  className={`p-1.5 rounded-lg text-xs transition border cursor-pointer ${
                    activeArabicSentence
                      ? "bg-white/[0.06] hover:bg-white/[0.10] text-[#F4F7FB] border-white/10"
                      : "bg-white/[0.02] text-white/20 border-transparent cursor-not-allowed"
                  }`}
                  title="نسخ النص العربي"
                  aria-label="Copy translated text"
                >
                  {copied ? (
                    <Check size={13} className="text-[#43D9BD]" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>

              {}
              <button
                onClick={handleConfirmAndSend}
                disabled={!activeArabicSentence}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeArabicSentence
                    ? "bg-[#43D9BD] hover:bg-[#34C7A8] text-[#0B0D12] shadow-xs"
                    : "bg-white/[0.04] text-white/25 border border-white/5 cursor-not-allowed"
                }`}
              >
                <span>حفظ في المحادثة</span>
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="lg:col-span-4 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#191F2B]/75 backdrop-blur-2xl border border-white/[0.10] shadow-[0_12px_40px_rgba(0,0,0,0.5)] apple-specular-edge relative overflow-hidden min-h-0">
        {}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#43D9BD]/8 to-transparent pointer-events-none" />

        {}
        <div className="w-full flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#43D9BD] shadow-[0_0_8px_rgba(67,217,189,0.8)] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#F4F7FB]/80 uppercase font-medium">
              MIRA COMPANION
            </span>
          </div>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-xs text-[#43D9BD] hover:underline font-mono cursor-pointer"
          >
            <Hand size={13} /> <span>Sign Guide</span>
          </button>
        </div>

        {}
        <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 w-full min-h-0 py-1">
          <MirageAvatar
            expression={avatarExpression}
            amplitude={amplitude}
            gaze={gaze}
            size={220}
            statusMessage={
              isAudioPlaying
                ? "Speaking Arabic translation…"
                : cameraActive
                  ? cameraPaused
                    ? "Camera paused · Resting"
                    : "Observing camera · Awaiting signs"
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

        {}
        <div className="w-full z-20 pt-1 shrink-0 flex flex-col items-center gap-2">
          <AvatarExpressionController />
          <AudioWaveform
            amplitude={amplitude}
            active={isAudioPlaying}
            barCount={16}
            color="#43D9BD"
          />

          {}
          <button
            onClick={onSwitchToChat}
            className="w-full py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer flex items-center justify-center gap-1.5 text-center"
          >
            <MessageSquare size={12} />
            <span>Switch to Text Chat Workspace</span>
          </button>
        </div>
      </div>
    </div>
  )
}
