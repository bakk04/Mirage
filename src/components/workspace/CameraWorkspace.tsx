"use client"
// Store subscriptions

// Local camera state & refs

// Chat & mic local state

// Sync camera active lifecycle

// Camera video loop and landmarks drawing

// Derived Arabic sentence

// Speak translation aloud with synchronized companion expression

// Copy translated text

// Confirm sentence & add to conversation history

// Smooth scroll to newest message

// Handle chat scrolling

// Send typed message

// Toggle voice input

// Replay message audio

// Copy single message text
/* ── PRIMARY COLUMN: CAMERA WORKSPACE + RECOGNITION & CHAT WORKSPACE ── */ /* ── AREA A: CAMERA WORKSPACE CARD ── */ /* Header Bar */ /* Camera Actions */ /* Video Viewport Area */ /* Viewport Footer Strip */ /* ── AREA B: TEXT/CHAT & ARSL RECOGNITION WORKSPACE CARD ── */ /* Sub-section 1: ArSL Live Sign Recognition Stream */ /* Sub-section 2: Arabic Translation Output & Quick Actions */ /* Sub-section 3: Multimodal Conversation History */ /* Independently Scrollable Message Stream */ /* Sub-section 4: Multimodal Composer */ /* ── SECONDARY COLUMN: MIRA AI COMPANION STAGE ── */ /* Subtle Top Ambient Accent Light */ /* Companion Header */ /* Expressive Character Stage */ /* Companion Controls & Waveform */
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
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
  Mic,
  Type,
  Command,
  Info,
  Hash,
  Zap,
  Loader2,
  UploadCloud,
  FileVideo,
} from "lucide-react"
import { useCamera } from "@/hooks/useCamera"
import { useMicrophone } from "@/hooks/useMicrophone"
import { useMirageStore } from "@/store/mirageStore"
import { arabicSignService } from "@/services/arabicSignRecognitionService"
import { gestureCommandService } from "@/services/gestureCommandService"
import { numberGestureService } from "@/services/numberGestureService"
import { speechService, speechQueue } from "@/services/speechService"
import MirageAvatar from "@/components/avatar/MirageAvatar"
import AvatarExpressionController from "@/components/avatar/AvatarExpressionController"
import AudioWaveform from "@/components/studio/AudioWaveform"
import type { GazeValues } from "@/hooks/useMousePosition"
import type {
  HandLandmarkPoint,
  MultimodalMessage,
  SpokenLanguageCode,
} from "@/types/mirage"

interface CameraWorkspaceProps {
  onOpenGuide?: () => void
  onSwitchToChat?: () => void
  amplitude?: number
  gaze: GazeValues
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [9, 10], [10, 11], [11, 12], // Middle
  [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17], // Palm
]

function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmarkPoint[],
  width: number,
  height: number,
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
    const x1 = p1.x * width
    const y1 = p1.y * height
    const x2 = p2.x * width
    const y2 = p2.y * height

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  for (const p of landmarks) {
    const x = p.x * width
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

export default function CameraWorkspace({
  onOpenGuide,
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
  const reconstructedArabicSentence = useMirageStore((s) => s.reconstructedArabicSentence)
  const isReconstructingSentence = useMirageStore((s) => s.isReconstructingSentence)
  const reconstructArabicSentence = useMirageStore((s) => s.reconstructArabicSentence)
  const removeSignToken = useMirageStore((s) => s.removeSignToken)
  const clearArabicDraft = useMirageStore((s) => s.clearArabicDraft)
  const clearSignDraft = useMirageStore((s) => s.clearSignDraft)
  const messages = useMirageStore((s) => s.messages)
  const addMessage = useMirageStore((s) => s.addMessage)

  const recognitionMode = useMirageStore((s) => s.recognitionMode)
  const setRecognitionMode = useMirageStore((s) => s.setRecognitionMode)
  const lastNumberResult = useMirageStore((s) => s.lastNumberResult)
  const recordNumberResult = useMirageStore((s) => s.recordNumberResult)
  const clearNumberResult = useMirageStore((s) => s.clearNumberResult)

  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setSpeakingState = useMirageStore((s) => s.setSpeakingState)
  const setVoiceListeningState = useMirageStore((s) => s.setVoiceListeningState)
  const settings = useMirageStore((s) => s.settings)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const autoReconstructTimerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [videoAnalyzing, setVideoAnalyzing] = useState<boolean>(false)
  const [resolutionLabel, setResolutionLabel] = useState<string>("Standby")
  const [isRestarting, setIsRestarting] = useState<boolean>(false)
  const [copiedSentence, setCopiedSentence] = useState<boolean>(false)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState("")
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [micTranscript, setMicTranscript] = useState("")
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const userScrolledUpRef = useRef(false)
  const latestLandmarksRef = useRef<HandLandmarkPoint[]>([])
  const frameCountRef = useRef(0)
  const lastFpsCalcRef = useRef(performance.now())

  const {
    videoRef,
    permission,
    devices,
    start: startCameraStream,
    stop: stopCameraStream,
    switchCamera,
    mirrored,
  } = useCamera(false)

  const {
    start: startMicAmplitude,
    stop: stopMicAmplitude,
    amplitude: micAmplitude,
  } = useMicrophone()

  const isRTL = settings.spokenLanguage === "ar"

  useEffect(() => {
    speechQueue.setListener((speaking) => setSpeakingState(speaking))

    const unsubArsl = arabicSignService.subscribePredictions((result) => {
      // Process Arabic Sign predictions in sign_language or dual modes
      const currentMode = useMirageStore.getState().recognitionMode
      if (currentMode !== "sign_language" && currentMode !== "dual") return

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
          // Hand withdrawn: if signs are waiting in buffer, trigger sentence reconstruction promptly
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
      if (lm.length === 0) {
        numberGestureService.reset()
      }
    })

    return () => {
      if (autoReconstructTimerRef.current) {
        clearTimeout(autoReconstructTimerRef.current)
      }
      unsubArsl()
      unsubLandmarks()
      speechQueue.clear()
    }
  }, [recordArabicSignResult, updateTelemetry, setSpeakingState])

  useEffect(() => {
    if (cameraActive) {
      void startCameraStream()
    } else {
      stopCameraStream()
      setResolutionLabel("Standby")
    }
  }, [cameraActive, startCameraStream, stopCameraStream])

  const handleStartCamera = () => {
    startCameraSession()
  }

  const handleStopCamera = () => {
    stopCameraSession()
  }

  const handleTogglePause = () => {
    if (cameraPaused) {
      resumeCameraSession()
    } else {
      pauseCameraSession()
    }
  }

  const handleToggleMirror = () => {
    updateSettings({ mirrorCamera: !mirrorCamera })
  }

  const handleRestartCamera = async () => {
    setIsRestarting(true)
    stopCameraSession()
    setTimeout(() => {
      startCameraSession()
      setIsRestarting(false)
    }, 400)
  }

  useEffect(() => {
    let active = true

    const loop = () => {
      if (!active) return

      const video = videoRef.current
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (video.videoWidth && video.videoHeight) {
          setResolutionLabel(`${video.videoWidth}×${video.videoHeight}`)
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

        const canvas = canvasRef.current
        if (canvas) {
          if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
          ) {
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
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
              )
            }
          }
        }

        // CONTROLLED RECOGNITION PIPELINE (MUTUALLY EXCLUSIVE / DUAL MODES)
        const currentMode = useMirageStore.getState().recognitionMode

        if (currentMode === "sign_language") {
          // ArSL model runs in sign_language mode
          if (arabicSignService.isReady()) {
            arabicSignService.processVideoFrame(video)
          }
          if (gestureCommandService.isReady()) {
            gestureCommandService.processVideoFrame(video)
          }
        } else if (currentMode === "browser_control") {
          // Dedicated Browser Control gesture recognition
          if (gestureCommandService.isReady()) {
            gestureCommandService.processVideoFrame(video)
          }
        } else if (currentMode === "dual") {
          // Dual mode: both pipelines process video with controlled scheduler
          if (arabicSignService.isReady()) {
            arabicSignService.processVideoFrame(video)
          }
          if (gestureCommandService.isReady()) {
            gestureCommandService.processVideoFrame(video)
          }
        } else if (currentMode === "numbers") {
          // Dedicated numbers engine: evaluates landmarks directly
          const numResult = numberGestureService.evaluateLandmarks(
            latestLandmarksRef.current,
          )
          if (numResult.isConfirmed) {
            recordNumberResult(numResult)
            updateTelemetry({ trackingConfidence: numResult.confidence })
            const s = useMirageStore.getState().settings
            if (s.autoSpeak && numResult.state === "detected" && numResult.number >= 0) {
              const spokenNumber =
                s.spokenLanguage === "ar"
                  ? ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة"][numResult.number] || `${numResult.number}`
                  : s.spokenLanguage === "fr"
                    ? ["zéro", "un", "deux", "trois", "quatre", "cinq"][numResult.number] || `${numResult.number}`
                    : `${numResult.number}`
              speechQueue.enqueue(
                spokenNumber,
                s.spokenLanguage || "ar",
                s.speechRate || 1.0,
                s.speechPitch || 1.0,
              )
            }
          } else if (numResult.isProvisional) {
            recordNumberResult(numResult)
          }

          if (gestureCommandService.isReady()) {
            gestureCommandService.processVideoFrame(video)
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
    mirrorCamera,
    settings.showLandmarks,
    settings.gestureCommandsEnabled,
    updateTelemetry,
    videoRef,
  ])
  const activeArabicSentence = useMemo(() => {
    if (reconstructedArabicSentence.trim()) return reconstructedArabicSentence.trim()
    if (arabicTranscript.trim()) return arabicTranscript.trim()
    if (accumulatedArabicSigns.length > 0)
      return accumulatedArabicSigns.join(" ")
    if (currentSignTokens.length > 0) {
      return currentSignTokens
        .map((t) => t.arabicLabel || t.gloss || t.token)
        .join(" ")
    }
    return ""
  }, [reconstructedArabicSentence, arabicTranscript, accumulatedArabicSigns, currentSignTokens])

  const handleUploadSignVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/arabic-sign/analyze-video", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Video analysis failed")
      const data = await res.json()
      if (data.status === "ok" && data.sentence) {
        useMirageStore.setState({
          reconstructedArabicSentence: data.sentence,
          arabicTranscript: data.sentence,
        })
        if (settings.autoSpeak) {
          speechQueue.enqueue(data.sentence, settings.spokenLanguage || "ar")
        }
        addMessage({
          id: `video-sign-${Date.now()}`,
          role: "user",
          source: "arabic_sign",
          content: data.sentence,
          timestamp: new Date(),
          language: "ar",
          isRTL: true,
        })
      }
    } catch (err) {
      console.error("Sign video error:", err)
    } finally {
      setVideoAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }
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
  const handleCopySentence = () => {
    if (!activeArabicSentence) return
    void navigator.clipboard.writeText(activeArabicSentence)
    setCopiedSentence(true)
    setTimeout(() => setCopiedSentence(false), 1600)
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
    userScrolledUpRef.current = false
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 60)

    if (settings.autoSpeak) {
      void speechService.speak(textToSubmit, settings.spokenLanguage, {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        onEnd: () => setSpeakingState(false),
        onError: () => setSpeakingState(false),
      })
    }
  }

  const [copiedNumber, setCopiedNumber] = useState(false)

  const handleSpeakNumber = async () => {
    if (!lastNumberResult || lastNumberResult.number < 0 || isAudioPlaying) return
    const s = settings
    const spokenNumber =
      s.spokenLanguage === "ar"
        ? ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة"][lastNumberResult.number] || `${lastNumberResult.number}`
        : s.spokenLanguage === "fr"
          ? ["zéro", "un", "deux", "trois", "quatre", "cinq"][lastNumberResult.number] || `${lastNumberResult.number}`
          : `${lastNumberResult.number}`

    setSpeakingState(true)
    await speechService.speak(spokenNumber, s.spokenLanguage, {
      rate: s.speechRate,
      pitch: s.speechPitch,
      onEnd: () => setSpeakingState(false),
      onError: () => setSpeakingState(false),
    })
  }

  const handleCopyNumber = () => {
    if (!lastNumberResult || lastNumberResult.number < 0) return
    void navigator.clipboard.writeText(`${lastNumberResult.number}`)
    setCopiedNumber(true)
    setTimeout(() => setCopiedNumber(false), 1600)
  }

  const handleInsertNumberToChat = () => {
    if (!lastNumberResult || lastNumberResult.number < 0) return
    const numStr = `${lastNumberResult.number}`
    const newMessage: MultimodalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      source: "sign",
      content: numStr,
      confidence: lastNumberResult.confidence,
      timestamp: new Date(),
      language: settings.spokenLanguage,
    }
    addMessage(newMessage)
    userScrolledUpRef.current = false
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 60)
  }

  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 100
  }, [])

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isListeningMic])
  const handleSendText = async () => {
    const text = inputVal.trim()
    if (!text) return

    const userMsg: MultimodalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      source: "typed",
      content: text,
      timestamp: new Date(),
      language: settings.spokenLanguage,
      isRTL,
    }

    addMessage(userMsg)
    setInputVal("")
    userScrolledUpRef.current = false
    setAvatarExpression("listening")

    setTimeout(async () => {
      setAvatarExpression("speaking")
      const reply =
        settings.spokenLanguage === "fr"
          ? `Bien reçu : "${text}". MIRA reste à votre disposition.`
          : settings.spokenLanguage === "ar"
            ? `وصلتني رسالتك: "${text}". أنا جاهز للتواصل الصوتي والإشاري معك.`
            : `Received: "${text}". MIRA is ready to assist you.`

      const mirageReply: MultimodalMessage = {
        id: crypto.randomUUID(),
        role: "mirage",
        source: "avatar",
        content: reply,
        confidence: 0.99,
        timestamp: new Date(),
        language: settings.spokenLanguage,
        isRTL,
      }

      addMessage(mirageReply)

      if (settings.autoSpeak) {
        setSpeakingState(true)
        await speechService.speak(reply, settings.spokenLanguage, {
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          onEnd: () => setSpeakingState(false),
          onError: () => setSpeakingState(false),
        })
      } else {
        setTimeout(() => setAvatarExpression("idle"), 2200)
      }
    }, 600)
  }
  const handleToggleVoiceInput = () => {
    if (isListeningMic) {
      speechService.stopListening()
      stopMicAmplitude()
      setIsListeningMic(false)
      setVoiceListeningState(false)

      if (micTranscript.trim()) {
        const voiceMsg: MultimodalMessage = {
          id: crypto.randomUUID(),
          role: "user",
          source: "speech",
          content: micTranscript.trim(),
          timestamp: new Date(),
          language: settings.spokenLanguage,
          isRTL,
        }
        addMessage(voiceMsg)
        setMicTranscript("")
        userScrolledUpRef.current = false

        setTimeout(async () => {
          setAvatarExpression("speaking")
          const reply =
            settings.spokenLanguage === "ar"
              ? "تم استلام رسالتك الصوتية بوضوح تام، وجاري معالجتها."
              : settings.spokenLanguage === "fr"
                ? "Message vocal bien reçu et transcrit avec succès."
                : "Voice message received and transcribed clearly."

          const mirageReply: MultimodalMessage = {
            id: crypto.randomUUID(),
            role: "mirage",
            source: "avatar",
            content: reply,
            confidence: 0.99,
            timestamp: new Date(),
            language: settings.spokenLanguage,
            isRTL,
          }
          addMessage(mirageReply)

          if (settings.autoSpeak) {
            setSpeakingState(true)
            await speechService.speak(reply, settings.spokenLanguage, {
              onEnd: () => setSpeakingState(false),
              onError: () => setSpeakingState(false),
            })
          }
        }, 600)
      }
    } else {
      setMicTranscript("")
      setIsListeningMic(true)
      setVoiceListeningState(true)
      void startMicAmplitude()

      const started = speechService.startListening(
        settings.spokenLanguage,
        (text) => setMicTranscript(text),
        () => {
          setIsListeningMic(false)
          stopMicAmplitude()
          setVoiceListeningState(false)
        },
      )

      if (!started) {
        setIsListeningMic(false)
        stopMicAmplitude()
        setVoiceListeningState(false)
      }
    }
  }
  const handleReplayAudio = async (msg: MultimodalMessage) => {
    if (isAudioPlaying) {
      speechService.stopSpeaking()
      setSpeakingState(false)
      return
    }

    setSpeakingState(true)
    await speechService.speak(
      msg.content,
      msg.language as SpokenLanguageCode || settings.spokenLanguage,
      {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        onEnd: () => setSpeakingState(false),
        onError: () => setSpeakingState(false),
      },
    )
  }
  const handleCopyMessage = (id: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    setTimeout(() => setCopiedMsgId(null), 1500)
  }

  const renderOriginBadge = (source: MultimodalMessage["source"]) => {
    switch (source) {
      case "arabic_sign":
      case "sign":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#45B9F5] bg-[#45B9F5]/14 border border-[#45B9F5]/30 px-2 py-0.5 rounded-md">
            <span>🤟</span> ArSL Sign
          </span>
        )
      case "speech":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#43D9BD] bg-[#43D9BD]/14 border border-[#43D9BD]/30 px-2 py-0.5 rounded-md">
            <Mic size={11} /> Voice
          </span>
        )
      case "typed":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#A1ACBC] bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md">
            <Type size={11} /> Text
          </span>
        )
      case "avatar":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#43D9BD] bg-[#43D9BD]/12 border border-[#43D9BD]/30 px-2 py-0.5 rounded-md">
            <Sparkles size={11} /> MIRA
          </span>
        )
      case "command":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#F2AE75] bg-[#F2AE75]/14 border border-[#F2AE75]/30 px-2 py-0.5 rounded-md">
            <Command size={11} /> Gesture
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#737F91] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
            <Info size={11} /> System
          </span>
        )
    }
  }

  return (
    <div className="w-full max-w-[1400px] flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-4 lg:gap-5 items-start select-none pb-4">
      {}
      <div className="flex flex-col gap-4 sm:gap-4.5 min-w-0 min-h-0">
        {}
        <section
          aria-label="Camera Workspace"
          className="relative rounded-2xl overflow-hidden bg-[#10141C]/85 backdrop-blur-xl border border-white/[0.10] shadow-sm apple-specular-edge flex flex-col"
        >
          {}
          <div className="relative z-20 px-3.5 py-2 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#10141C]/90 backdrop-blur-md">
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

                  <button
                    onClick={handleStopCamera}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 transition cursor-pointer"
                    title="Stop camera session"
                  >
                    <Square size={10} fill="currentColor" />
                    <span>Stop</span>
                  </button>

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
          <div className="relative w-full aspect-[16/9] min-h-[240px] sm:min-h-[280px] max-h-[440px] bg-[#0B0D12] flex items-center justify-center overflow-hidden">
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

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              style={{
                transform: mirrorCamera && mirrored ? "scaleX(-1)" : undefined,
              }}
            />

            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_95%_85%_at_50%_50%,transparent_65%,rgba(11,13,18,0.7)_100%)] z-10" />

            {cameraActive && !cameraPaused && (
              <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0B0D12]/85 border border-white/[0.10] text-[11px] font-mono text-[#43D9BD] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#43D9BD] animate-pulse" />
                <span>SIGNING SPACE ACTIVE</span>
              </div>
            )}

            {cameraActive && cameraPaused && (
              <div className="relative z-20 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0B0D12]/90 border border-[#F2AE75]/30 text-xs text-[#F2AE75] backdrop-blur-md font-mono">
                <Pause size={13} />
                <span>Camera Paused · MIRA Companion in Resting State</span>
              </div>
            )}

            {!cameraActive && permission !== "denied" && (
              <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-md">
                <div className="p-4 flex flex-col items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.10] flex items-center justify-center text-[#43D9BD] shadow-xs">
                    <Camera size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#F4F7FB] tracking-wide">
                      Arabic Sign Language Camera Standby
                    </h3>
                    <p className="text-xs text-[#A1ACBC] mt-1 leading-relaxed max-w-sm">
                      Enable your camera stream to recognize Arabic sign
                      language (ArSL) in real time and converse with your MIRA
                      companion.
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

            {permission === "denied" && (
              <div className="relative z-30 flex flex-col items-center justify-center p-6 text-center max-w-sm">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-2.5">
                  <CameraOff size={20} />
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
                  className="mt-2.5 px-3.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.10] text-xs text-[#F4F7FB] font-medium hover:bg-white/[0.09] transition cursor-pointer"
                >
                  Retry Permission
                </button>
              </div>
            )}
          </div>

          {}
          {/* Viewport Footer Strip */}
          <div className="relative z-20 px-3.5 py-1.5 flex items-center justify-between gap-2 border-t border-white/[0.08] bg-[#10141C]/90 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A1ACBC]">
              <ShieldCheck size={12} className="text-[#43D9BD]" />
              <span>Private On-Device Video Stream</span>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#A1ACBC]/60">
              <span className="text-[#43D9BD]">
                {recognitionMode === "sign_language"
                  ? "ArSL Sign Language"
                  : recognitionMode === "browser_control"
                    ? "Browser Control"
                    : recognitionMode === "dual"
                      ? "Dual Pipeline"
                      : "Numbers (0-5)"}
              </span>
              <span>·</span>
              <span>ArSL CNN & MediaPipe: Ready</span>
            </div>
          </div>
        </section>

        {/* ── AREA B: TEXT/CHAT & ARSL RECOGNITION WORKSPACE CARD ── */}
        <section
          aria-label="Recognition Output and Chat Workspace"
          className="rounded-2xl bg-[#191F2B]/75 backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.45)] apple-specular-edge p-3.5 sm:p-4.5 flex flex-col gap-3.5 min-w-0"
        >
          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setRecognitionMode("sign_language")}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition cursor-pointer ${
                recognitionMode === "sign_language"
                  ? "bg-[#45B9F5]/15 border border-[#45B9F5]/40 text-[#45B9F5] font-semibold shadow-xs"
                  : "text-[#A1ACBC] hover:text-[#F4F7FB] border border-transparent hover:bg-white/[0.04]"
              }`}
            >
              <Sparkles size={13} />
              <span className="font-arabic font-medium">لغة الإشارة (ArSL)</span>
            </button>

            <button
              type="button"
              onClick={() => setRecognitionMode("browser_control")}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition cursor-pointer ${
                recognitionMode === "browser_control"
                  ? "bg-[#F2AE75]/15 border border-[#F2AE75]/40 text-[#F2AE75] font-semibold shadow-xs"
                  : "text-[#A1ACBC] hover:text-[#F4F7FB] border border-transparent hover:bg-white/[0.04]"
              }`}
            >
              <Command size={13} />
              <span>التحكم بالمتصفح (Browser Control)</span>
            </button>

            <button
              type="button"
              onClick={() => setRecognitionMode("dual")}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition cursor-pointer ${
                recognitionMode === "dual"
                  ? "bg-[#43D9BD]/15 border border-[#43D9BD]/40 text-[#43D9BD] font-semibold shadow-xs"
                  : "text-[#A1ACBC] hover:text-[#F4F7FB] border border-transparent hover:bg-white/[0.04]"
              }`}
            >
              <Cpu size={13} />
              <span>الوضع المزدوج (Dual)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecognitionMode("numbers")
                clearNumberResult()
              }}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition cursor-pointer ${
                recognitionMode === "numbers"
                  ? "bg-[#43D9BD]/15 border border-[#43D9BD]/40 text-[#43D9BD] font-semibold shadow-xs"
                  : "text-[#A1ACBC] hover:text-[#F4F7FB] border border-transparent hover:bg-white/[0.04]"
              }`}
            >
              <Hash size={13} />
              <span>الأرقام (0-5)</span>
            </button>
          </div>

          {/* ── BROWSER GESTURE CONTROL HUD CARD ── */}
          {(recognitionMode === "browser_control" || recognitionMode === "dual") && (
            <div className="p-3.5 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08] flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#F2AE75] flex items-center gap-1.5 font-semibold">
                  <Command size={13} /> إيماءات التحكم بالمتصفح (Browser Gestures)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F2AE75]/15 border border-[#F2AE75]/35 text-[#F2AE75] font-medium">
                  {settings.gestureCommandsEnabled ? "ACTIF · ANTI-REBOND" : "DÉSACTIVÉ"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Gesture 5: Close Tab */}
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#F2AE75]/15 border border-[#F2AE75]/30 flex items-center justify-center text-base font-mono font-bold text-[#F2AE75] shrink-0">
                    5
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F4F7FB]">Gesture 5</span>
                      <span className="text-[10px] font-mono text-[#F2AE75] bg-[#F2AE75]/10 px-1.5 py-0.2 rounded">Exit Tab</span>
                    </div>
                    <span className="text-[11px] text-[#A1ACBC] block mt-0.5">Fermer l'onglet actif / Quitter</span>
                    <button
                      type="button"
                      onClick={() => recordGestureCommand({
                        commandId: `cmd-${Date.now()}`,
                        commandType: "close_tab",
                        type: "close_tab",
                        label: "Gesture 5: Close Tab / Exit",
                        description: "Fermeture de l'onglet actif",
                        confidence: 1.0,
                        timestamp: Date.now(),
                        requiresConfirmation: true,
                        status: "pending",
                      })}
                      className="mt-1.5 text-[10px] font-mono text-[#F2AE75] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap size={10} /> Déclencher
                    </button>
                  </div>
                </div>

                {/* Gesture 2 Up: Scroll Up */}
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#43D9BD]/15 border border-[#43D9BD]/30 flex items-center justify-center text-base font-mono font-bold text-[#43D9BD] shrink-0">
                    2↑
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F4F7FB]">Gesture 2 — Up</span>
                      <span className="text-[10px] font-mono text-[#43D9BD] bg-[#43D9BD]/10 px-1.5 py-0.2 rounded">Scroll Up</span>
                    </div>
                    <span className="text-[11px] text-[#A1ACBC] block mt-0.5">Défiler vers le haut</span>
                    <button
                      type="button"
                      onClick={() => recordGestureCommand({
                        commandId: `cmd-${Date.now()}`,
                        commandType: "scroll_up",
                        type: "scroll_up",
                        label: "Gesture 2 — Up: Scroll Up",
                        description: "Défilement vers le haut",
                        confidence: 1.0,
                        timestamp: Date.now(),
                        requiresConfirmation: false,
                        status: "executing",
                      })}
                      className="mt-1.5 text-[10px] font-mono text-[#43D9BD] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap size={10} /> Défiler (-350px)
                    </button>
                  </div>
                </div>

                {/* Gesture 2 Down: Scroll Down */}
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#43D9BD]/15 border border-[#43D9BD]/30 flex items-center justify-center text-base font-mono font-bold text-[#43D9BD] shrink-0">
                    2↓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F4F7FB]">Gesture 2 — Down</span>
                      <span className="text-[10px] font-mono text-[#43D9BD] bg-[#43D9BD]/10 px-1.5 py-0.2 rounded">Scroll Down</span>
                    </div>
                    <span className="text-[11px] text-[#A1ACBC] block mt-0.5">Défiler vers le bas</span>
                    <button
                      type="button"
                      onClick={() => recordGestureCommand({
                        commandId: `cmd-${Date.now()}`,
                        commandType: "scroll_down",
                        type: "scroll_down",
                        label: "Gesture 2 — Down: Scroll Down",
                        description: "Défilement vers le bas",
                        confidence: 1.0,
                        timestamp: Date.now(),
                        requiresConfirmation: false,
                        status: "executing",
                      })}
                      className="mt-1.5 text-[10px] font-mono text-[#43D9BD] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap size={10} /> Défiler (+350px)
                    </button>
                  </div>
                </div>

                {/* Gesture 3: Refresh */}
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#45B9F5]/15 border border-[#45B9F5]/30 flex items-center justify-center text-base font-mono font-bold text-[#45B9F5] shrink-0">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F4F7FB]">Gesture 3</span>
                      <span className="text-[10px] font-mono text-[#45B9F5] bg-[#45B9F5]/10 px-1.5 py-0.2 rounded">Refresh</span>
                    </div>
                    <span className="text-[11px] text-[#A1ACBC] block mt-0.5">Rafraîchir la page actuelle</span>
                    <button
                      type="button"
                      onClick={() => recordGestureCommand({
                        commandId: `cmd-${Date.now()}`,
                        commandType: "refresh_page",
                        type: "refresh_page",
                        label: "Gesture 3: Refresh Current Page",
                        description: "Rechargement de la page",
                        confidence: 1.0,
                        timestamp: Date.now(),
                        requiresConfirmation: false,
                        status: "executing",
                      })}
                      className="mt-1.5 text-[10px] font-mono text-[#45B9F5] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap size={10} /> Recharger
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {recognitionMode === "numbers" ? (
            /* ── NUMBERS MODE (0-5) ── */
            <div className="p-3.5 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08] flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#43D9BD] flex items-center gap-1.5 font-semibold">
                  <Hash size={13} /> Reconnaissance des Chiffres (0-5)
                </span>
                {lastNumberResult && lastNumberResult.state === "detected" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#43D9BD]/15 border border-[#43D9BD]/35 text-[#43D9BD] font-medium">
                    {lastNumberResult.isConfirmed ? "STABLE · CONFIRMÉ" : "DÉTECTÉ"}
                  </span>
                )}
                {lastNumberResult && lastNumberResult.state === "unrecognized" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 font-medium">
                    NON RECONNU
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                {lastNumberResult && lastNumberResult.state === "detected" && lastNumberResult.number >= 0 ? (
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-[#43D9BD]/15 border border-[#43D9BD]/40 flex items-center justify-center text-3xl font-mono font-bold text-[#43D9BD] shadow-[0_0_16px_rgba(67,217,189,0.25)]">
                      {lastNumberResult.number}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#F4F7FB]">
                        Chiffre reconnu : {lastNumberResult.number}
                      </span>
                      <span className="text-xs text-[#A1ACBC] font-mono">
                        Confiance : {Math.round(lastNumberResult.confidence * 100)}% · Événement unique stabilisé
                      </span>
                    </div>
                  </div>
                ) : lastNumberResult && lastNumberResult.state === "unrecognized" ? (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xl font-mono text-amber-400">
                      ?
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-amber-300">
                        Geste non reconnu
                      </span>
                      <span className="text-xs text-[#A1ACBC]">
                        Présentez 0 (poing), 1, 2, 3, 4 ou 5 doigts nets face à la caméra
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-[#737F91] italic py-2">
                    <Hand size={20} className="text-[#A1ACBC]/50" />
                    <span>Présentez votre main devant la caméra (chiffres 0 à 5)…</span>
                  </div>
                )}

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleSpeakNumber}
                    disabled={!lastNumberResult || lastNumberResult.state !== "detected" || isAudioPlaying}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      lastNumberResult && lastNumberResult.state === "detected"
                        ? "bg-[#43D9BD]/14 hover:bg-[#43D9BD]/22 text-[#43D9BD] border border-[#43D9BD]/35 shadow-xs"
                        : "bg-white/[0.04] text-white/30 border border-transparent cursor-not-allowed"
                    }`}
                    title="Prononcer le chiffre"
                  >
                    <Volume2 size={13} className={isAudioPlaying ? "animate-pulse" : ""} />
                    <span>{isAudioPlaying ? "Vocalisation…" : "Vocaliser"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    disabled={!lastNumberResult || lastNumberResult.state !== "detected"}
                    className={`p-1.5 rounded-lg text-xs transition border cursor-pointer ${
                      lastNumberResult && lastNumberResult.state === "detected"
                        ? "bg-white/[0.06] hover:bg-white/[0.10] text-[#F4F7FB] border-white/10"
                        : "bg-white/[0.02] text-white/20 border-transparent cursor-not-allowed"
                    }`}
                    title="Copier le chiffre"
                    aria-label="Copy recognized number"
                  >
                    {copiedNumber ? (
                      <Check size={13} className="text-[#43D9BD]" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertNumberToChat}
                    disabled={!lastNumberResult || lastNumberResult.state !== "detected"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      lastNumberResult && lastNumberResult.state === "detected"
                        ? "bg-[#43D9BD] hover:bg-[#34C7A8] text-[#0B0D12] shadow-xs active:scale-[0.98]"
                        : "bg-white/[0.04] text-white/25 border border-white/5 cursor-not-allowed"
                    }`}
                    title="Envoyer dans la conversation"
                  >
                    <Send size={11} />
                    <span>Envoyer</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── ARSL SIGN TRANSLATION PANEL (AVAILABLE IN SIGN_LANGUAGE AND DUAL MODES) ── */}
          {(recognitionMode === "sign_language" || recognitionMode === "dual") && (
            <>
              {/* Mode Bar & Video Upload */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gradient-to-r from-[#43D9BD]/10 via-[#45B9F5]/10 to-transparent border border-[#43D9BD]/20">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        signSpeechMode:
                          settings.signSpeechMode === "letter" ? "sentence" : "letter",
                      })
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                      settings.signSpeechMode !== "letter"
                        ? "bg-[#43D9BD]/20 text-[#43D9BD] border border-[#43D9BD]/40 shadow-xs"
                        : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                    }`}
                    title="Basculer entre la lecture de phrases complètes avec Gemini AI et l'épellation lettre par lettre"
                  >
                    <Sparkles size={11} className={settings.signSpeechMode !== "letter" ? "animate-pulse" : ""} />
                    <span>
                      {settings.signSpeechMode !== "letter"
                        ? "⚡ Mode Phrases Complètes (Gemini)"
                        : "🔤 Mode Lettre par lettre"}
                    </span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/*"
                    onChange={handleUploadSignVideo}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={videoAnalyzing}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-[#45B9F5] bg-[#45B9F5]/10 border border-[#45B9F5]/30 hover:bg-[#45B9F5]/20 transition cursor-pointer disabled:opacity-50"
                    title="Analyser une vidéo de phrase en langue des signes"
                  >
                    {videoAnalyzing ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <UploadCloud size={11} />
                    )}
                    <span>{videoAnalyzing ? "Analyse vidéo…" : "Vidéo de signes"}</span>
                  </button>
                </div>

                <span className="text-[10px] font-mono text-white/50 hidden sm:inline">
                  {settings.signSpeechMode !== "letter" ? "Auto-synthèse vocale activée" : "Épellation manuelle"}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
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
                      <RotateCcw size={10} /> مسح المسودة
                    </button>
                  )}
                </div>

                <div
                  className="flex flex-wrap items-center gap-1.5 min-h-[36px] max-h-20 overflow-y-auto p-1.5 rounded-xl bg-[#0B0D12]/60 border border-white/[0.06]"
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

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08] flex flex-col justify-between gap-2 shadow-inner">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#43D9BD] flex items-center gap-1.5 font-semibold">
                      <Sparkles size={12} /> الترجمة اللفظية المعتمدة (جمل كاملة):
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isReconstructingSentence && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#43D9BD]/20 border border-[#43D9BD]/40 text-[#43D9BD] flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />
                          <span>Gemini AI…</span>
                        </span>
                      )}
                      {activeArabicSentence && !isReconstructingSentence && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#43D9BD]/15 border border-[#43D9BD]/35 text-[#43D9BD] font-medium">
                          {reconstructedArabicSentence ? "GEMINI SENTENCE" : "TRANSLATION READY"}
                        </span>
                      )}
                    </div>
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

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSpeakTranslation}
                      disabled={!activeArabicSentence || isAudioPlaying}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        activeArabicSentence
                          ? "bg-[#43D9BD]/14 hover:bg-[#43D9BD]/22 text-[#43D9BD] border border-[#43D9BD]/35 shadow-xs"
                          : "bg-white/[0.04] text-white/30 border border-transparent cursor-not-allowed"
                      }`}
                      title="نطق الترجمة بالصوت العربي"
                    >
                      <Volume2
                        size={13}
                        className={isAudioPlaying ? "animate-pulse" : ""}
                      />
                      <span>{isAudioPlaying ? "جاري النطق…" : "نطق صوتي"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void reconstructArabicSentence()}
                      disabled={accumulatedArabicSigns.length === 0 || isReconstructingSentence}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#45B9F5]/10 hover:bg-[#45B9F5]/20 text-[#45B9F5] border border-[#45B9F5]/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Forcer la reconstitution en phrase via Gemini AI"
                    >
                      {isReconstructingSentence ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      <span>تركيب الجملة</span>
                    </button>

                    <button
                      onClick={handleCopySentence}
                      disabled={!activeArabicSentence}
                      className={`p-1.5 rounded-lg text-xs transition border cursor-pointer ${
                        activeArabicSentence
                          ? "bg-white/[0.06] hover:bg-white/[0.10] text-[#F4F7FB] border-white/10"
                          : "bg-white/[0.02] text-white/20 border-transparent cursor-not-allowed"
                      }`}
                      title="نسخ النص العربي"
                      aria-label="Copy translated text"
                    >
                      {copiedSentence ? (
                        <Check size={13} className="text-[#43D9BD]" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleConfirmAndSend}
                    disabled={!activeArabicSentence}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeArabicSentence
                        ? "bg-[#43D9BD] hover:bg-[#34C7A8] text-[#0B0D12] shadow-xs active:scale-[0.98]"
                        : "bg-white/[0.04] text-white/25 border border-white/5 cursor-not-allowed"
                    }`}
                  >
                    <span>حفظ وتأكيد</span>
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </>
          )}

          {}
          <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A1ACBC] flex items-center gap-1.5 font-medium">
                <MessageSquare size={12} className="text-[#43D9BD]" />
                <span>سجل المحادثة التفاعلي (Interactive Conversation)</span>
              </span>
              <span className="text-[11px] text-[#737F91]">
                {messages.length} رسالة مسجلة
              </span>
            </div>

            {}
            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="max-h-[240px] min-h-[120px] overflow-y-auto space-y-2.5 pr-1.5 overscroll-contain rounded-xl p-2 bg-[#0B0D12]/40 border border-white/[0.05]"
            >
              {messages.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#737F91] italic font-arabic">
                  لا توجد رسائل سابقة. ابدأ بإشارة يد أمام الكاميرا، أو استخدم
                  الميكروفون، أو اكتب رسالة أدناه.
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "user"
                  const isSystem = msg.source === "system"

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex flex-col ${
                        isSystem
                          ? "items-center text-center"
                          : isUser
                            ? "items-end"
                            : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {renderOriginBadge(msg.source)}
                        <span className="text-[10px] font-mono text-[#737F91]">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`relative group max-w-[88%] sm:max-w-[80%] rounded-xl p-2.5 text-xs sm:text-sm leading-relaxed ${
                          isSystem
                            ? "bg-white/[0.03] border border-white/[0.06] text-[#A1ACBC] text-xs max-w-md shadow-xs"
                            : isUser
                              ? "bg-[#43D9BD]/12 border border-[#43D9BD]/30 text-[#F4F7FB] rounded-tr-xs shadow-xs"
                              : "bg-[#10141C]/85 border border-white/[0.08] text-[#F4F7FB] rounded-tl-xs shadow-xs"
                        }`}
                        dir={msg.isRTL ? "rtl" : "ltr"}
                      >
                        {msg.originalArabicGloss && (
                          <div className="text-[10px] font-mono text-[#45B9F5] mb-1 tracking-wider uppercase">
                            إشارات ArSL: {msg.originalArabicGloss}
                          </div>
                        )}

                        <p
                          className={
                            msg.isRTL
                              ? "font-arabic text-right leading-relaxed"
                              : ""
                          }
                        >
                          {msg.content}
                        </p>

                        {!isSystem && (
                          <div className="mt-1 pt-1 border-t border-white/[0.06] flex items-center gap-2 justify-end opacity-75 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleReplayAudio(msg)}
                              className="text-[10px] font-mono text-[#A1ACBC] hover:text-[#43D9BD] flex items-center gap-1 cursor-pointer transition"
                              title="Replay audio aloud"
                            >
                              <Volume2 size={10} /> نطق
                            </button>
                            <button
                              onClick={() =>
                                handleCopyMessage(msg.id, msg.content)
                              }
                              className="text-[10px] font-mono text-[#A1ACBC] hover:text-white flex items-center gap-1 cursor-pointer transition"
                              title="Copy text"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check size={10} className="text-[#43D9BD]" />
                              ) : (
                                <Copy size={10} />
                              )}
                              نسخ
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {}
          <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2">
            {isListeningMic && (
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-xs text-sky-400 font-mono">
                    Listening:{" "}
                    {micTranscript
                      ? `"${micTranscript}"`
                      : "Speak aloud in Arabic…"}
                  </span>
                </div>
                <AudioWaveform
                  amplitude={micAmplitude.get()}
                  active={true}
                  barCount={12}
                  color="#38BDF8"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleVoiceInput}
                className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer shrink-0 ${
                  isListeningMic
                    ? "bg-[#43D9BD] text-[#0B0D12] border-[#43D9BD] shadow-[0_0_12px_rgba(67,217,189,0.4)]"
                    : "bg-white/[0.05] text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.09] border-white/[0.10]"
                }`}
                title={
                  isListeningMic
                    ? "إيقاف التسجيل الصوتي"
                    : "تحدث عبر الميكروفون"
                }
                aria-label={
                  isListeningMic
                    ? "Stop recording voice"
                    : "Speak via microphone"
                }
              >
                {isListeningMic ? <Square size={15} /> : <Mic size={15} />}
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void handleSendText()
                    }
                  }}
                  placeholder="اكتب رسالة للتواصل أو الاستفسار عن لغة الإشارة…"
                  className="w-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/[0.10] focus:border-[#43D9BD]/60 focus:ring-1 focus:ring-[#43D9BD]/40 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#F4F7FB] outline-none transition placeholder:text-[#737F91] text-right font-arabic"
                  dir="rtl"
                />
              </div>

              <button
                onClick={handleSendText}
                disabled={!inputVal.trim()}
                className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer shrink-0 ${
                  inputVal.trim()
                    ? "bg-[#43D9BD] hover:bg-[#34C7A8] text-[#0B0D12] font-semibold border-[#43D9BD] shadow-xs active:scale-[0.98]"
                    : "bg-white/[0.03] text-white/20 border-white/[0.06] cursor-not-allowed"
                }`}
                title="Send message"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {}
      <aside
        aria-label="MIRA AI Companion"
        className="flex flex-col gap-3 sm:gap-3.5 p-4 sm:p-4.5 rounded-2xl bg-[#191F2B]/75 backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.45)] apple-specular-edge relative overflow-hidden h-fit lg:sticky lg:top-20"
      >
        {}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#43D9BD]/8 to-transparent pointer-events-none" />

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
        <div className="flex flex-col items-center justify-center z-10 w-full py-1">
          <MirageAvatar
            expression={avatarExpression}
            amplitude={amplitude}
            gaze={gaze}
            size={195}
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
        <div className="w-full z-20 pt-1 shrink-0 flex flex-col items-center gap-2.5">
          <AvatarExpressionController />

          <AudioWaveform
            amplitude={amplitude}
            active={isAudioPlaying || isListeningMic}
            barCount={16}
            color="#43D9BD"
          />

          <button
            onClick={handleToggleVoiceInput}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
              isListeningMic
                ? "bg-[#43D9BD] text-[#0B0D12] border-[#43D9BD] shadow-[0_0_12px_rgba(67,217,189,0.4)]"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#F4F7FB]"
            }`}
          >
            {isListeningMic ? (
              <Square size={13} />
            ) : (
              <Mic size={13} className="text-[#43D9BD]" />
            )}
            <span>
              {isListeningMic
                ? "إيقاف التحدث الصوتي"
                : "تحدث مع الرفيق [Space]"}
            </span>
          </button>

          <div className="text-[10px] font-mono text-[#737F91] tracking-wider text-center">
            Zero-Cloud Vision Privacy · MobileNetV2
          </div>
        </div>
      </aside>
    </div>
  )
}
