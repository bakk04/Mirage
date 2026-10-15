"use client"

// Re-export Message interface for compatibility

// Arabic Sign Language is the focus
// Navigation & Panel

// Master Session State
// Compatibility alias for cameraPaused

// Model Readiness Statuses (Truthful!)

// Arabic Sign Language outputs
// Sign stream tokens

// Command status
// Compatibility alias

// Aesthetics & Visuals

// Multimodal Conversation History

// Telemetry
// Compatibility alias

// Settings

// Workspace Mode (Mutually Exclusive: camera vs chat)

// Collapsible Workspace Layout

// Actions

// Master Session Actions

// Speech & Voice Synchronization

// Model integration updates

// Messages

// Settings & Telemetry

// Truthful statuses: Neither model is currently installed

// Start Camera: activates camera stream, transitions robot to observing state

// Pause Camera: pauses recognition, robot relaxes into paused state

// Resume Camera: resumes observing

// Stop Camera: stops frame capture, releases resources, robot returns to idle

// Synchronized Speech: mouth moves during actual speech, returns to observing if camera still active
// Finished speaking: return to observing if camera active, otherwise idle

// Voice Listening: microphone activated for hearing user

import { create } from "zustand"
import { speechQueue } from "@/services/speechService"
import type {
  ArabicSignResult,
  AvatarExpressionState,
  GestureCommandResult,
  LanguageOption,
  MirageSettings,
  ModelIntegrationStatus,
  ModelTelemetryData,
  MultimodalMessage,
  NumberGestureResult,
  RecognitionMode,
  SessionLifecycleState,
  SignLanguageCode,
  SignSpeechMode,
  SignToken,
  SpokenLanguageCode,
} from "@/types/mirage"

export type MirageStateType = "idle" | "listening" | "camera" | "understanding" | "conversation" | "speaking" | "memory" | "imagine" | "studio"
export type Message = MultimodalMessage

export interface MemoryCapture {
  id: string
  timestamp: number
  label: string
  blobUrl: string
  signLanguage?: string
  confidence?: number
}
export const SIGN_LANGUAGES: LanguageOption[] = [
  {
    code: "arsl",
    name: "Arabic Sign Language",
    nativeName: "لغة الإشارة العربية (ArSL)",
    region: "Arab World & MENA",
    isRTL: true,
  },
]

export const SPOKEN_LANGUAGES: LanguageOption[] = [
  {
    code: "ar",
    name: "Arabic (العربية)",
    nativeName: "العربية",
    region: "Arab World",
    isRTL: true,
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    region: "Global",
  },
  {
    code: "fr",
    name: "French (Français)",
    nativeName: "Français",
    region: "France / Francophonie",
  },
]

export const AVATAR_EXPRESSION_LABELS: Record<AvatarExpressionState, string> = {
  idle: "Ready · Resting",
  observing: "Observing Camera",
  listening: "Listening to Voice",
  thinking: "Thinking · Processing",
  sign_detected: "Sign Detected",
  analyzing: "Analyzing Frame",
  translating: "Translating Language",
  speaking: "Speaking Translation",
  understanding: "Understood",
  happy: "Welcoming · Pleased",
  curious: "Curious · Inquisitive",
  confused: "Awaiting Clarification",
  reassuring: "Reassuring",
  low_confidence: "Low Confidence Check",
  executing_command: "Executing Interface Command",
  success: "Action Completed",
  error: "Session Notice",
  paused: "Session Paused",
}

interface MirageStore {
  state: MirageStateType
  activePanel: "studio" | "history" | "guide" | "settings" | "diagnostics"
  avatarExpression: AvatarExpressionState
  sessionStatus: SessionLifecycleState
  cameraActive: boolean
  cameraPaused: boolean
  isSessionPaused: boolean
  isAudioPlaying: boolean
  mobileNetStatus: ModelIntegrationStatus
  mobileNetStatusLabel: string
  mediaPipeStatus: ModelIntegrationStatus
  mediaPipeStatusLabel: string
  lastArabicSignResult: ArabicSignResult | null
  accumulatedArabicSigns: string[]
  arabicTranscript: string
  reconstructedArabicSentence: string
  isReconstructingSentence: boolean
  reconstructArabicSentence: (forcedLetters?: string[]) => Promise<string | null>
  currentSignTokens: SignToken[]
  lastGestureCommand: GestureCommandResult | null
  currentCommand: GestureCommandResult | null
  dominantColor: string
  messages: MultimodalMessage[]
  memories: MemoryCapture[]
  telemetry: ModelTelemetryData
  diagnostics: ModelTelemetryData
  settings: MirageSettings
  workspaceMode: "camera" | "chat"
  setWorkspaceMode: (mode: "camera" | "chat") => void
  recognitionMode: RecognitionMode
  setRecognitionMode: (mode: RecognitionMode) => void
  lastNumberResult: NumberGestureResult | null
  recordNumberResult: (result: NumberGestureResult) => void
  clearNumberResult: () => void
  isTranscriptOpen: boolean
  setIsTranscriptOpen: (open: boolean) => void
  toggleTranscript: () => void
  setState: (s: MirageStateType) => void
  setActivePanel: (
    panel: "studio" | "history" | "guide" | "settings" | "diagnostics",
  ) => void
  setAvatarExpression: (expr: AvatarExpressionState) => void
  setDominantColor: (c: string) => void
  startCameraSession: () => void
  pauseCameraSession: () => void
  resumeCameraSession: () => void
  stopCameraSession: () => void
  setIsSessionPaused: (paused: boolean) => void
  setSpeakingState: (isSpeaking: boolean) => void
  setIsAudioPlaying: (isPlaying: boolean) => void
  setVoiceListeningState: (isListening: boolean) => void
  setArabicModelStatus: (status: ModelIntegrationStatus, label: string) => void
  setGestureModelStatus: (status: ModelIntegrationStatus, label: string) => void
  recordArabicSignResult: (result: ArabicSignResult) => void
  clearArabicDraft: () => void
  addSignToken: (token: SignToken) => void
  removeSignToken: (id: string) => void
  clearSignDraft: () => void
  recordGestureCommand: (cmd: GestureCommandResult) => void
  setCurrentCommand: (cmd: GestureCommandResult | null) => void
  addMessage: (m: MultimodalMessage) => void
  clearMessages: () => void
  addMemory: (m: MemoryCapture) => void
  updateSettings: (s: Partial<MirageSettings>) => void
  updateTelemetry: (t: Partial<ModelTelemetryData>) => void
  updateDiagnostics: (t: Partial<ModelTelemetryData>) => void
}

const INITIAL_MESSAGES: MultimodalMessage[] = [
  {
    id: "init-1",
    role: "mirage",
    source: "system",
    content:
      "نظام ميراج للتواصل بلغة الإشارة العربية (ArSL) جاهز. الكاميرا والصوت متزامنان مع الروبوت.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    language: "ar",
    isRTL: true,
  },
  {
    id: "init-2",
    role: "mirage",
    source: "avatar",
    content:
      "مرحباً بك! أنا رفيقك الذكي للتواصل. قمت بمزامنة واجهة الكاميرا والصوت مع تعابير وجهي، وجاهز للربط مع نموذج لغة الإشارة العربية (MobileNetV2) ونموذج إيماءات التحكم (MediaPipe).",
    confidence: 0.99,
    timestamp: new Date(Date.now() - 1000 * 60),
    language: "ar",
    isRTL: true,
  },
]

export const useMirageStore = create<MirageStore>((set, get) => ({
  state: "idle",
  activePanel: "studio",
  avatarExpression: "idle",

  sessionStatus: "idle",
  workspaceMode: "camera",
  cameraActive: false,
  cameraPaused: false,
  isSessionPaused: false,
  isAudioPlaying: false,
  isTranscriptOpen: false,

  setWorkspaceMode: (workspaceMode) => {
    if (workspaceMode === "chat") {
      const current = get()
      if (current.cameraActive) {
        current.stopCameraSession()
      }
      set({ workspaceMode: "chat", state: "conversation" })
    } else {
      set({ workspaceMode: "camera", state: "camera" })
    }
  },
  mobileNetStatus: "awaiting_integration",
  mobileNetStatusLabel: "Awaiting Arabic model integration (MobileNetV2 ArSL)",
  mediaPipeStatus: "awaiting_integration",
  mediaPipeStatusLabel: "Awaiting gesture recognizer integration (MediaPipe)",

  recognitionMode: "sign_language",
  setRecognitionMode: (recognitionMode) =>
    set({
      recognitionMode,
      currentCommand: null,
      lastNumberResult: null,
    }),
  lastNumberResult: null,
  recordNumberResult: (result) =>
    set((prev) => {
      const nextExpr =
        result.state === "detected"
          ? "understanding"
          : result.state === "unrecognized"
            ? "confused"
            : prev.avatarExpression
      return {
        lastNumberResult: result,
        avatarExpression: nextExpr,
      }
    }),
  clearNumberResult: () => set({ lastNumberResult: null }),

  lastArabicSignResult: null,
  accumulatedArabicSigns: [],
  arabicTranscript: "",
  reconstructedArabicSentence: "",
  isReconstructingSentence: false,
  currentSignTokens: [],

  lastGestureCommand: null,
  currentCommand: null,

  dominantColor: "#3DDBB5",
  messages: INITIAL_MESSAGES,
  memories: [],

  telemetry: {
    mobileNetStatus: "awaiting_integration",
    mobileNetStatusLabel: "Awaiting Arabic model integration",
    mediaPipeStatus: "awaiting_integration",
    mediaPipeStatusLabel: "Awaiting gesture recognizer integration",
    fps: 0,
    inferenceLatencyMs: 0,
    trackingConfidence: 0,
    handsDetectedCount: 0,
    cameraResolution: "Off",
    backendConnected: false,
  },
  diagnostics: {
    mobileNetStatus: "awaiting_integration",
    mobileNetStatusLabel: "Awaiting Arabic model integration",
    mediaPipeStatus: "awaiting_integration",
    mediaPipeStatusLabel: "Awaiting gesture recognizer integration",
    fps: 0,
    inferenceLatencyMs: 0,
    trackingConfidence: 0,
    handsDetectedCount: 0,
    cameraResolution: "Off",
    backendConnected: false,
  },

  settings: {
    soundDesign: true,
    reduceMotion: false,
    mirrorCamera: true,
    autoSpeak: true,
    signSpeechMode: "sentence",
    autoSentenceDelayMs: 1200,
    gestureCommandsEnabled: true,
    requireConfirmation: true,
    confidenceThreshold: 0.75,
    signLanguage: "arsl",
    spokenLanguage: "ar",
    speechRate: 1.0,
    speechPitch: 1.0,
    highContrast: false,
    showLandmarks: true,
    showDiagnosticsHUD: true,
    cameraDevice: "default",
    microphoneDevice: "default",
  },

  setState: (s) =>
    set((prev) => (canTransition(prev.state, s) ? { state: s } : prev)),

  setActivePanel: (activePanel) => set({ activePanel }),
  setAvatarExpression: (avatarExpression) => set({ avatarExpression }),
  setDominantColor: (dominantColor) => set({ dominantColor }),

  setIsTranscriptOpen: (isTranscriptOpen) => set({ isTranscriptOpen }),
  toggleTranscript: () =>
    set((prev) => ({ isTranscriptOpen: !prev.isTranscriptOpen })),
  startCameraSession: () =>
    set(() => ({
      workspaceMode: "camera",
      cameraActive: true,
      cameraPaused: false,
      isSessionPaused: false,
      sessionStatus: "observing",
      avatarExpression: "observing",
      state: "camera",
    })),
  pauseCameraSession: () =>
    set(() => ({
      cameraPaused: true,
      isSessionPaused: true,
      sessionStatus: "paused",
      avatarExpression: "paused",
    })),
  resumeCameraSession: () =>
    set(() => ({
      cameraPaused: false,
      isSessionPaused: false,
      sessionStatus: "observing",
      avatarExpression: "observing",
    })),
  stopCameraSession: () =>
    set(() => ({
      cameraActive: false,
      cameraPaused: false,
      isSessionPaused: false,
      sessionStatus: "idle",
      avatarExpression: "idle",
      state: "idle",
    })),

  setIsSessionPaused: (paused: boolean) => {
    if (paused) {
      get().pauseCameraSession()
    } else {
      get().resumeCameraSession()
    }
  },
  setSpeakingState: (isSpeaking: boolean) =>
    set((prev) => {
      if (isSpeaking) {
        return {
          isAudioPlaying: true,
          avatarExpression: "speaking",
          sessionStatus: "speaking",
        }
      }
      const nextExpr =
        prev.cameraActive && !prev.cameraPaused ? "observing" : "idle"
      const nextSession =
        prev.cameraActive && !prev.cameraPaused ? "observing" : "idle"
      return {
        isAudioPlaying: false,
        avatarExpression: nextExpr,
        sessionStatus: nextSession,
      }
    }),

  setIsAudioPlaying: (isPlaying: boolean) => {
    get().setSpeakingState(isPlaying)
  },
  setVoiceListeningState: (isListening: boolean) =>
    set((prev) => {
      if (isListening) {
        return {
          sessionStatus: "listening",
          avatarExpression: "listening",
        }
      }
      const nextExpr =
        prev.cameraActive && !prev.cameraPaused ? "observing" : "idle"
      return {
        sessionStatus: prev.cameraActive ? "observing" : "idle",
        avatarExpression: nextExpr,
      }
    }),

  setArabicModelStatus: (mobileNetStatus, mobileNetStatusLabel) =>
    set({ mobileNetStatus, mobileNetStatusLabel }),

  setGestureModelStatus: (mediaPipeStatus, mediaPipeStatusLabel) =>
    set({ mediaPipeStatus, mediaPipeStatusLabel }),

  recordArabicSignResult: (result) =>
    set((prev) => {
      // Only record ArSL signs if in sign_language or dual mode
      if (prev.recognitionMode !== "sign_language" && prev.recognitionMode !== "dual") {
        return { lastArabicSignResult: result }
      }

      // If provisional, only update the last result preview
      if (!result.isConfirmed) {
        return { lastArabicSignResult: result }
      }

      const token: SignToken = {
        id: `${result.signId}-${Date.now()}`,
        token: result.arabicLabel,
        gloss: result.glossArabic,
        arabicLabel: result.arabicLabel,
        confidence: result.confidence,
        timestamp: result.timestamp,
        language: "arsl",
        translation: { ar: result.arabicLabel },
      }
      return {
        lastArabicSignResult: result,
        accumulatedArabicSigns: [
          ...prev.accumulatedArabicSigns,
          result.arabicLabel,
        ],
        arabicTranscript: prev.arabicTranscript
          ? `${prev.arabicTranscript} ${result.arabicLabel}`
          : result.arabicLabel,
        currentSignTokens: [...prev.currentSignTokens, token],
        avatarExpression: "sign_detected",
      }
    }),

  addSignToken: (token) =>
    set((prev) => ({
      currentSignTokens: [...prev.currentSignTokens, token],
      accumulatedArabicSigns: [
        ...prev.accumulatedArabicSigns,
        token.arabicLabel || token.gloss,
      ],
      arabicTranscript: prev.arabicTranscript
        ? `${prev.arabicTranscript} ${token.arabicLabel || token.gloss}`
        : token.arabicLabel || token.gloss,
      avatarExpression: "translating",
    })),

  removeSignToken: (id) =>
    set((prev) => ({
      currentSignTokens: prev.currentSignTokens.filter((t) => t.id !== id),
    })),

  clearArabicDraft: () =>
    set({
      lastArabicSignResult: null,
      accumulatedArabicSigns: [],
      arabicTranscript: "",
      reconstructedArabicSentence: "",
      isReconstructingSentence: false,
      currentSignTokens: [],
    }),

  clearSignDraft: () =>
    set({
      lastArabicSignResult: null,
      accumulatedArabicSigns: [],
      arabicTranscript: "",
      reconstructedArabicSentence: "",
      isReconstructingSentence: false,
      currentSignTokens: [],
    }),

  reconstructArabicSentence: async (forcedLetters?: string[]) => {
    const letters = forcedLetters || get().accumulatedArabicSigns
    if (!letters || letters.length === 0) return null

    set({ isReconstructingSentence: true, avatarExpression: "translating" })
    try {
      const res = await fetch("/api/arabic-sign/reconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letters, speak: false }),
      })
      if (!res.ok) throw new Error("Reconstruction HTTP error")
      const data = await res.json()
      const sentence = (data.sentence && data.sentence.trim()) || letters.join("")

      set({
        reconstructedArabicSentence: sentence,
        isReconstructingSentence: false,
        arabicTranscript: sentence,
        avatarExpression: "understanding",
      })

      const { settings } = get()
      if (settings.autoSpeak && sentence) {
        speechQueue.enqueue(
          sentence,
          settings.spokenLanguage || "ar",
          settings.speechRate || 1.0,
          settings.speechPitch || 1.0,
        )
      }

      const tokenMessage: MultimodalMessage = {
        id: `arsl-sentence-${Date.now()}`,
        role: "user",
        source: "arabic_sign",
        content: sentence,
        timestamp: new Date(),
        language: "ar",
        isRTL: true,
      }
      set((prev) => ({ messages: [...prev.messages, tokenMessage] }))

      return sentence
    } catch (err) {
      console.warn("Reconstruction fallback locally:", err)
      const fallbackSentence = letters.join("")
      set({
        reconstructedArabicSentence: fallbackSentence,
        isReconstructingSentence: false,
      })
      return fallbackSentence
    }
  },

  recordGestureCommand: (cmd) =>
    set({
      lastGestureCommand: cmd,
      currentCommand: cmd,
      avatarExpression: "executing_command",
    }),

  setCurrentCommand: (cmd) =>
    set({
      lastGestureCommand: cmd,
      currentCommand: cmd,
    }),

  addMessage: (m) => set((prev) => ({ messages: [...prev.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  addMemory: (m) => set((prev) => ({ memories: [m, ...prev.memories] })),

  updateSettings: (s) =>
    set((prev) => ({ settings: { ...prev.settings, ...s } })),

  updateTelemetry: (t) =>
    set((prev) => {
      const merged = { ...prev.telemetry, ...t }
      return { telemetry: merged, diagnostics: merged }
    }),

  updateDiagnostics: (t) =>
    set((prev) => {
      const merged = { ...prev.telemetry, ...t }
      return { telemetry: merged, diagnostics: merged }
    }),
}))

export const STATE_LABELS: Record<MirageStateType, string> = {
  idle: "Ready",
  listening: "Listening (Voice)",
  camera: "Observing Camera",
  understanding: "Arabic Sign Studio",
  conversation: "Multimodal Chat",
  speaking: "Speaking Translation",
  memory: "Archive",
  imagine: "Studio",
  studio: "Arabic Studio",
}

export const STATE_ORDER: MirageStateType[] = [
  "idle",
  "listening",
  "camera",
  "understanding",
  "conversation",
  "speaking",
  "memory",
  "imagine",
]

export const STATE_TRANSITIONS = STATE_ORDER.reduce(
  (transitions, source) => {
    transitions[source] = STATE_ORDER.filter((target) => target !== source)
    return transitions
  },
  {} as Record<MirageStateType, readonly MirageStateType[]>,
)

export function canTransition(from: MirageStateType, to: MirageStateType) {
  return from !== to && (STATE_TRANSITIONS[from]?.includes(to) ?? true)
}
