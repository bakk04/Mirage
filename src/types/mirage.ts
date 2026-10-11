/**
 * MIRAGE AI - Sign Language & Gesture Interaction Platform
 * Core Type Definitions
 */

export type AvatarExpressionState =
  | "idle"
  | "listening"
  | "thinking"
  | "sign_detected"
  | "analyzing"
  | "translating"
  | "speaking"
  | "understanding"
  | "happy"
  | "curious"
  | "confused"
  | "reassuring"
  | "low_confidence"
  | "executing_command"
  | "success"
  | "error"
  | "paused"

// Retain compatibility with existing MirageStateType
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

export type SignLanguageCode = "asl" | "lsf" | "arsl"
export type SpokenLanguageCode = "en" | "fr" | "ar"

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
  region: string
  isRTL?: boolean
}

export interface HandLandmarkPoint {
  x: number // Normalized 0-1
  y: number // Normalized 0-1
  z: number // Estimated depth
  name?: string
}

export interface HandTrackingResult {
  detected: boolean
  handedness: "left" | "right" | "both" | "none"
  landmarks: HandLandmarkPoint[]
  palmCenter?: { x: number; y: number }
  boundingBox?: { x: number; y: number; width: number; height: number }
  gestureName?: string
  confidence: number
}

export interface SignToken {
  id: string
  token: string
  gloss: string
  translation: {
    en: string
    fr: string
    ar: string
  }
  confidence: number
  timestamp: number
  language: SignLanguageCode
  isCommand?: boolean
  commandAction?: GestureCommandType
}

export type GestureCommandType =
  | "start_session"
  | "pause_resume"
  | "stop_session"
  | "repeat_speech"
  | "switch_mode"
  | "toggle_audio"
  | "confirm_action"
  | "cancel_action"
  | "open_guide"
  | "open_diagnostics"

export interface GestureCommand {
  type: GestureCommandType
  label: string
  description: string
  gestureDescription: string
  confidence: number
  status: "idle" | "pending" | "executing" | "completed" | "cancelled"
  requiresConfirmation: boolean
  triggerTimestamp?: number
}

export type MessageSource =
  | "sign"
  | "speech"
  | "typed"
  | "avatar"
  | "command"
  | "system"

export interface MultimodalMessage {
  id: string
  role: "user" | "mirage" | "system"
  source: MessageSource
  content: string
  originalGloss?: string
  signTokens?: SignToken[]
  confidence?: number
  timestamp: Date | number
  language: string
  isRTL?: boolean
  audioPlayed?: boolean
  audioDuration?: number
}

export interface DiagnosticsData {
  fps: number
  inferenceLatencyMs: number
  trackingConfidence: number
  handsDetectedCount: number
  modelName: string
  backendConnected: boolean
  webglActive: boolean
  lastEvent?: string
  lastEventTimestamp?: number
}

export interface MirageSettings {
  soundDesign: boolean
  reduceMotion: boolean
  mirrorCamera: boolean
  autoSpeak: boolean
  gestureCommandsEnabled: boolean
  requireConfirmation: boolean
  confidenceThreshold: number
  signLanguage: SignLanguageCode
  spokenLanguage: SpokenLanguageCode
  speechRate: number
  speechPitch: number
  highContrast: boolean
  showLandmarks: boolean
  showDiagnosticsHUD: boolean
  cameraDevice: string
  microphoneDevice: string
}
