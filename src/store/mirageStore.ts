"use client"
import { create } from "zustand"
import type {
  AvatarExpressionState,
  DiagnosticsData,
  GestureCommand,
  LanguageOption,
  MirageSettings,
  MultimodalMessage,
  SignLanguageCode,
  SignToken,
  SpokenLanguageCode,
} from "@/types/mirage"

export type MirageStateType =
  | "idle"
  | "listening"
  | "camera"
  | "understanding"
  | "conversation"
  | "speaking"
  | "memory"
  | "imagine"
  | "studio"

// Re-export Message interface for compatibility
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
    code: "asl",
    name: "American Sign Language",
    nativeName: "ASL",
    region: "USA / Canada / International",
  },
  {
    code: "lsf",
    name: "Langue des Signes Française",
    nativeName: "LSF",
    region: "France / Francophonie",
  },
  {
    code: "arsl",
    name: "Arabic Sign Language",
    nativeName: "لغة الإشارة العربية",
    region: "Middle East & North Africa",
    isRTL: true,
  },
]

export const SPOKEN_LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    name: "English (US)",
    nativeName: "English",
    region: "Global",
  },
  {
    code: "fr",
    name: "French (Français)",
    nativeName: "Français",
    region: "France / Canada",
  },
  {
    code: "ar",
    name: "Arabic (العربية)",
    nativeName: "العربية",
    region: "Arab World",
    isRTL: true,
  },
]

export const AVATAR_EXPRESSION_LABELS: Record<AvatarExpressionState, string> = {
  idle: "Ready · Attentive",
  listening: "Listening to Voice",
  thinking: "Thinking · Reflecting",
  sign_detected: "Sign Detected",
  analyzing: "Analyzing Hand Tracking",
  translating: "Synthesizing Language",
  speaking: "Speaking Translation",
  understanding: "Understood",
  happy: "Joyful · Pleased",
  curious: "Curious · Inquisitive",
  confused: "Clarification Needed",
  reassuring: "Reassuring · Encouraging",
  low_confidence: "Low Confidence Check",
  executing_command: "Executing Gesture Command",
  success: "Action Succeeded",
  error: "Session Error",
  paused: "Translation Paused",
}

interface MirageStore {
  // Navigation & Primary Workspace
  state: MirageStateType
  activePanel: "studio" | "history" | "guide" | "settings" | "diagnostics"
  avatarExpression: AvatarExpressionState

  // Colors & Aesthetic
  dominantColor: string

  // Session & Recognition State
  isSessionActive: boolean
  isSessionPaused: boolean
  isAudioPlaying: boolean
  currentSignTokens: SignToken[]
  confirmedSentence: string
  provisionalSentence: string
  currentCommand: GestureCommand | null

  // Messages & Timeline
  messages: MultimodalMessage[]
  memories: MemoryCapture[]

  // Diagnostics & Real-time metrics
  diagnostics: DiagnosticsData

  // User Settings
  settings: MirageSettings

  // Actions
  setState: (s: MirageStateType) => void
  setActivePanel: (
    panel: "studio" | "history" | "guide" | "settings" | "diagnostics",
  ) => void
  setAvatarExpression: (expr: AvatarExpressionState) => void
  setDominantColor: (c: string) => void
  setIsSessionActive: (active: boolean) => void
  setIsSessionPaused: (paused: boolean) => void
  setIsAudioPlaying: (playing: boolean) => void

  // Sign & Sentence management
  addSignToken: (token: SignToken) => void
  removeSignToken: (id: string) => void
  clearSignDraft: () => void
  setConfirmedSentence: (sentence: string) => void
  setProvisionalSentence: (sentence: string) => void
  setCurrentCommand: (cmd: GestureCommand | null) => void

  // Messaging & Memories
  addMessage: (m: MultimodalMessage) => void
  clearMessages: () => void
  addMemory: (m: MemoryCapture) => void

  // Settings & Diagnostics
  updateSettings: (s: Partial<MirageSettings>) => void
  updateDiagnostics: (d: Partial<DiagnosticsData>) => void
}

const INITIAL_MESSAGES: MultimodalMessage[] = [
  {
    id: "init-1",
    role: "mirage",
    source: "system",
    content:
      "MIRAGE AI Sign Translation initialized. Camera and neural gesture tracking are active. Sign in front of the lens or speak to begin.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    language: "en",
  },
  {
    id: "init-2",
    role: "user",
    source: "sign",
    originalGloss: "HELLO WELCOME PLEASE HELP",
    content: "Hello! Welcome, could you please help me?",
    confidence: 0.96,
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    language: "en",
    signTokens: [
      {
        id: "tok-1",
        token: "HELLO",
        gloss: "HELLO",
        translation: { en: "Hello", fr: "Bonjour", ar: "مرحباً" },
        confidence: 0.98,
        timestamp: Date.now() - 1000 * 60 * 2,
        language: "asl",
      },
      {
        id: "tok-2",
        token: "HELP",
        gloss: "HELP",
        translation: { en: "Help", fr: "Aide", ar: "مساعدة" },
        confidence: 0.94,
        timestamp: Date.now() - 1000 * 60 * 2,
        language: "asl",
      },
    ],
  },
  {
    id: "init-3",
    role: "mirage",
    source: "avatar",
    content:
      "Hello! I can translate your signs into fluent speech and text in real time. Show me your gestures, or speak aloud if you are a hearing partner.",
    confidence: 0.99,
    timestamp: new Date(Date.now() - 1000 * 50),
    language: "en",
  },
]

export const useMirageStore = create<MirageStore>((set) => ({
  state: "idle",
  activePanel: "studio",
  avatarExpression: "idle",
  dominantColor: "#5EEAD4",

  isSessionActive: true,
  isSessionPaused: false,
  isAudioPlaying: false,
  currentSignTokens: [],
  confirmedSentence: "",
  provisionalSentence: "",
  currentCommand: null,

  messages: INITIAL_MESSAGES,
  memories: [],

  diagnostics: {
    fps: 30,
    inferenceLatencyMs: 14,
    trackingConfidence: 0.94,
    handsDetectedCount: 1,
    modelName: "Mirage-SignKinematics-v3",
    backendConnected: false,
    webglActive: true,
    lastEvent: "System Initialized",
    lastEventTimestamp: Date.now(),
  },

  settings: {
    soundDesign: true,
    reduceMotion: false,
    mirrorCamera: true,
    autoSpeak: true,
    gestureCommandsEnabled: true,
    requireConfirmation: true,
    confidenceThreshold: 0.7,
    signLanguage: "asl",
    spokenLanguage: "en",
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

  setActivePanel: (panel) => set({ activePanel: panel }),
  setAvatarExpression: (avatarExpression) => set({ avatarExpression }),
  setDominantColor: (dominantColor) => set({ dominantColor }),
  setIsSessionActive: (isSessionActive) => set({ isSessionActive }),
  setIsSessionPaused: (isSessionPaused) => set({ isSessionPaused }),
  setIsAudioPlaying: (isAudioPlaying) => set({ isAudioPlaying }),

  addSignToken: (token) =>
    set((prev) => {
      // Avoid duplicate consecutive tokens within 600ms
      const last = prev.currentSignTokens[prev.currentSignTokens.length - 1]
      if (
        last &&
        last.token === token.token &&
        Date.now() - last.timestamp < 700
      ) {
        return prev
      }
      return { currentSignTokens: [...prev.currentSignTokens, token] }
    }),

  removeSignToken: (id) =>
    set((prev) => ({
      currentSignTokens: prev.currentSignTokens.filter((t) => t.id !== id),
    })),

  clearSignDraft: () =>
    set({
      currentSignTokens: [],
      provisionalSentence: "",
      confirmedSentence: "",
    }),

  setConfirmedSentence: (confirmedSentence) => set({ confirmedSentence }),
  setProvisionalSentence: (provisionalSentence) => set({ provisionalSentence }),
  setCurrentCommand: (currentCommand) => set({ currentCommand }),

  addMessage: (m) => set((prev) => ({ messages: [...prev.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  addMemory: (m) => set((prev) => ({ memories: [m, ...prev.memories] })),

  updateSettings: (newSettings) =>
    set((prev) => ({
      settings: { ...prev.settings, ...newSettings },
    })),

  updateDiagnostics: (d) =>
    set((prev) => ({
      diagnostics: { ...prev.diagnostics, ...d },
    })),
}))

export const STATE_LABELS: Record<MirageStateType, string> = {
  idle: "Live Studio",
  listening: "Listening (Voice)",
  camera: "Sign Camera",
  understanding: "Interpreting Signs",
  conversation: "Conversation",
  speaking: "Synthesizing Speech",
  memory: "Session Archive",
  imagine: "Gesture Laboratory",
  studio: "Live Studio",
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
