/**
 * MIRAGE AI - Core Type Definitions
 * Focus: Interface Synchronization & Preparation for Arabic Sign Recognition
 */

export type AvatarExpressionState = "idle" | "observing" | "listening" | "thinking" | "sign_detected" | "analyzing" | "translating" | "speaking" | "understanding" | "happy" | "curious" | "confused" | "reassuring" | "low_confidence" | "executing_command" | "success" | "error" | "paused"

// Session lifecycle states
export type SessionLifecycleState = "idle" | "camera_starting" | "observing" | "paused" | "listening" | "speaking" | "error"

// Model integration status states
export type ModelIntegrationStatus = "unloaded" | "awaiting_integration" | "initializing" | "ready" | "error"

export type SignLanguageCode = "arsl" | "asl" | "lsf" // Arabic Sign Language (ArSL) is primary focus
export type SpokenLanguageCode = "ar" | "en" | "fr"

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
  palmCenter?: {
    x: number
    y: number
  }
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  gestureName?: string
  confidence: number
}

export type RecognitionMode = "sign_language" | "browser_control" | "dual" | "numbers"

export interface NumberGestureResult {
  number: number // 0, 1, 2, 3, 4, 5, or -1 for unrecognized
  label: string // "5", "4", "3", "2", "1", "0" or "Geste non reconnu"
  confidence: number
  timestamp: number
  isConfirmed: boolean
  isProvisional: boolean
  state: "detected" | "unrecognized" | "no_hand"
}

// Arabic Sign Language recognition contract
export interface ArabicSignResult {
  signId: string
  arabicLabel: string
  glossArabic: string
  spokenLabel?: string
  confidence: number
  timestamp: number
  isProvisional: boolean
  isConfirmed: boolean
  inferenceMs?: number
  state?: "no_hand" | "recognizing" | "confirmed" | "unrecognized" | "uncertain"
}

// Interface gesture command contract (Reserved for MediaPipe Gesture Recognizer & Browser Control)
export type GestureCommandType =
  | "close_tab"
  | "scroll_up"
  | "scroll_down"
  | "refresh_page"
  | "start_session"
  | "pause_resume"
  | "stop_session"
  | "repeat_speech"
  | "switch_mode"
  | "clear_transcript"
  | "toggle_audio"
  | "confirm_action"
  | "cancel_action"
  | "open_guide"
  | "open_diagnostics"
  | "close_app"
  | "increase_value"
  | "decrease_value"

export interface GestureCommandResult {
  commandId: string
  commandType: GestureCommandType
  type?: GestureCommandType // Backwards compatibility alias
  label: string
  description: string
  gestureDescription?: string
  confidence: number
  timestamp: number
  requiresConfirmation: boolean
  status: "idle" | "pending" | "executing" | "completed" | "cancelled"
}

// Alias for backwards compatibility
export type GestureCommand = GestureCommandResult

// Token structure for sign stream display
export interface SignToken {
  id: string
  token: string
  gloss: string
  arabicLabel?: string
  translation?: {
    ar?: string
    en?: string
    fr?: string
  }
  confidence: number
  timestamp: number
  language: SignLanguageCode | string
  isCommand?: boolean
  commandAction?: GestureCommandType
}

export type MessageSource = "arabic_sign" | "sign" | "speech" | "typed" | "avatar" | "command" | "system"

export interface MultimodalMessage {
  id: string
  role: "user" | "mirage" | "system"
  source: MessageSource
  content: string
  originalArabicGloss?: string
  originalGloss?: string
  signTokens?: SignToken[]
  confidence?: number
  timestamp: Date | number
  language: string
  isRTL?: boolean
  audioPlayed?: boolean
  audioDuration?: number
}

export interface ModelTelemetryData {
  mobileNetStatus: ModelIntegrationStatus
  mobileNetStatusLabel: string
  mediaPipeStatus: ModelIntegrationStatus
  mediaPipeStatusLabel: string
  fps: number
  inferenceLatencyMs: number
  trackingConfidence: number
  handsDetectedCount: number
  cameraResolution: string
  backendConnected: boolean
  modelName?: string
  webglActive?: boolean
  lastEvent?: string
  lastEventTimestamp?: number
}

// Alias for backwards compatibility
export type DiagnosticsData = ModelTelemetryData

export type SignSpeechMode = "sentence" | "letter"

export interface ReconstructedSentenceResult {
  sentence: string
  originalLetters: string
  source: "gemini" | "local_heuristic" | "local_fallback" | "none"
  latencyMs?: number
  timestamp: number
}

export interface MirageSettings {
  soundDesign: boolean
  reduceMotion: boolean
  mirrorCamera: boolean
  autoSpeak: boolean
  signSpeechMode?: SignSpeechMode
  autoSentenceDelayMs?: number
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

