/**
 * MIRAGE AI - Arabic Sign Recognition Service
 *
 * Integrated Model: ArSL CNN (32 static Arabic alphabet/sign classes)
 * Paired with MediaPipe Hand Landmarker for real-time bounding box extraction.
 *
 * Provides real-time frame capture, persistent WebSocket transport with HTTP fallback,
 * temporal smoothing, hysteresis locking, anti-repetition duplicate suppression,
 * neutral re-arming, and event dispatch.
 */

import { defaultMirageBridge, type ArabicSignPayload } from "@/lib/mirageBridge"
import type { ArabicSignResult, ModelIntegrationStatus } from "@/types/mirage"

export interface ArabicModelConfig {
  weightsPath?: string
  classesPath?: string
  inferenceEndpoint?: string
  confidenceThreshold?: number
  smoothingWindowMs?: number
  cooldownMs?: number
}

export const ARSL_SPOKEN_MAP: Record<
  string,
  { spokenAr: string; nameEn: string; letter: string }
> = {
  ain: { spokenAr: "عَيْن", nameEn: "Ain", letter: "ع" },
  al: { spokenAr: "ال", nameEn: "Al", letter: "ال" },
  aleff: { spokenAr: "أَلِف", nameEn: "Alef", letter: "أ" },
  bb: { spokenAr: "بَاء", nameEn: "Baa", letter: "ب" },
  dal: { spokenAr: "دَال", nameEn: "Dal", letter: "د" },
  dha: { spokenAr: "ظَاء", nameEn: "Dhaa", letter: "ظ" },
  dhad: { spokenAr: "ضَاد", nameEn: "Dhad", letter: "ض" },
  fa: { spokenAr: "فَاء", nameEn: "Faa", letter: "ف" },
  gaaf: { spokenAr: "قَاف", nameEn: "Qaaf", letter: "ق" },
  ghain: { spokenAr: "غَيْن", nameEn: "Ghain", letter: "غ" },
  ha: { spokenAr: "هَاء", nameEn: "Haa", letter: "ه" },
  haa: { spokenAr: "حَاء", nameEn: "Haa", letter: "ح" },
  jeem: { spokenAr: "جِيم", nameEn: "Jeem", letter: "ج" },
  kaaf: { spokenAr: "كَاف", nameEn: "Kaaf", letter: "ك" },
  khaa: { spokenAr: "خَاء", nameEn: "Khaa", letter: "خ" },
  la: { spokenAr: "لَا", nameEn: "Laa", letter: "لا" },
  laam: { spokenAr: "لَام", nameEn: "Laam", letter: "ل" },
  meem: { spokenAr: "مِيم", nameEn: "Meem", letter: "م" },
  nun: { spokenAr: "نُون", nameEn: "Noon", letter: "ن" },
  ra: { spokenAr: "رَاء", nameEn: "Raa", letter: "ر" },
  saad: { spokenAr: "صَاد", nameEn: "Saad", letter: "ص" },
  seen: { spokenAr: "سِين", nameEn: "Seen", letter: "س" },
  sheen: { spokenAr: "شِين", nameEn: "Sheen", letter: "ش" },
  ta: { spokenAr: "تَاء", nameEn: "Taa", letter: "ت" },
  taa: { spokenAr: "طَاء", nameEn: "Taa", letter: "ط" },
  thaa: { spokenAr: "ثَاء", nameEn: "Thaa", letter: "ث" },
  thal: { spokenAr: "ذَال", nameEn: "Thal", letter: "ذ" },
  toot: { spokenAr: "تَاء مَرْبُوطَة", nameEn: "Taa Marbouta", letter: "ة" },
  waw: { spokenAr: "وَاو", nameEn: "Waaw", letter: "و" },
  ya: { spokenAr: "أَلِف مَقْصُورَة", nameEn: "Alef Maqsura", letter: "ى" },
  yaa: { spokenAr: "يَاء", nameEn: "Yaa", letter: "ي" },
  zay: { spokenAr: "زَاي", nameEn: "Zaay", letter: "ز" },
}

type PredictionListener = (result: ArabicSignResult) => void
type StatusListener = (status: ModelIntegrationStatus, label: string) => void

interface RawDetection {
  signId: string
  arabicLabel: string
  glossArabic: string
  confidence: number
  timestamp: number
}

export class ArabicSignRecognitionService {
  private status: ModelIntegrationStatus = "unloaded"
  private statusLabel = "ArSL Model initializing"
  private predictionListeners = new Set<PredictionListener>()
  private statusListeners = new Set<StatusListener>()
  private inferenceEndpoint: string = "/api/arabic-sign/predict"
  private confidenceThreshold = 0.68
  private cooldownMs = 1800
  private lastInferenceAt = 0
  private inferenceInFlight = false
  private frameSequence = 0

  // Temporal anti-loop stabilization structures
  private rollingWindow: RawDetection[] = []
  private lockedSign: string | null = null
  private lastConfirmedSign: string | null = null
  private lastConfirmedTime = 0
  private consecutiveNoHand = 0
  private consecutiveMatchingFrames = 0
  private canvas: HTMLCanvasElement | null = null
  private unsubWsPrediction: (() => void) | null = null

  constructor() {
    // Wire up real-time WebSocket predictions
    this.unsubWsPrediction = defaultMirageBridge.on("arabic_sign", (payload) => {
      this.handleWsPayload(payload)
    })
  }

  public getStatus(): ModelIntegrationStatus {
    return this.status
  }

  public getStatusLabel(): string {
    return this.statusLabel
  }

  public isReady(): boolean {
    return this.status === "ready"
  }

  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0.3, Math.min(0.95, threshold))
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    listener(this.status, this.statusLabel)
    return () => this.statusListeners.delete(listener)
  }

  public subscribePredictions(listener: PredictionListener): () => void {
    this.predictionListeners.add(listener)
    return () => this.predictionListeners.delete(listener)
  }

  /**
   * Resets temporal recognition locks (called on mode switch or manual clear).
   */
  public resetState(): void {
    this.rollingWindow = []
    this.lockedSign = null
    this.lastConfirmedSign = null
    this.consecutiveNoHand = 0
    this.consecutiveMatchingFrames = 0
    this.inferenceInFlight = false
  }

  /**
   * Initializes connection to the Arabic Sign Language model backend.
   */
  public async initialize(config?: ArabicModelConfig): Promise<boolean> {
    if (config?.confidenceThreshold !== undefined) {
      this.confidenceThreshold = config.confidenceThreshold
    }
    if (config?.cooldownMs !== undefined) {
      this.cooldownMs = config.cooldownMs
    }

    this.status = "initializing"
    this.statusLabel = "Verifying ArSL CNN model service"
    this.notifyStatus()

    // 1. Connect WebSocket bridge
    defaultMirageBridge.connect()

    // 2. Health check endpoint check
    const candidateEndpoints = config?.inferenceEndpoint
      ? [config.inferenceEndpoint]
      : ["/api/arabic-sign/predict", "http://127.0.0.1:8000/api/arabic-sign/predict"]

    for (const endpoint of candidateEndpoints) {
      try {
        const healthUrl = `${endpoint.replace(/\/predict$/, "")}/health`
        const response = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) })
        if (!response.ok) continue
        const health = await response.json()
        if (health.available) {
          this.inferenceEndpoint = endpoint
          this.status = "ready"
          this.statusLabel = "ArSL CNN Ready (32 static Arabic alphabet classes)"
          this.notifyStatus()
          return true
        }
      } catch {
        // Try next candidate
      }
    }

    this.status = "error"
    this.statusLabel = "ArSL backend offline (ensure FastAPI runs on port 8000)"
    this.notifyStatus()
    return false
  }

  /**
   * Process a single video frame with throttling, persistent WebSocket transport,
   * temporal smoothing, and neutral re-arming.
   */
  public processVideoFrame(
    videoElement: HTMLVideoElement | null,
  ): ArabicSignResult | null {
    if (!this.isReady() || !videoElement) return null

    const now = Date.now()
    // Throttle inference: maximum 8-10 FPS to ensure low latency and steady UI
    if (this.inferenceInFlight || now - this.lastInferenceAt < 110) {
      return null
    }

    const vw = videoElement.videoWidth
    const vh = videoElement.videoHeight
    if (!vw || !vh || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null
    }

    this.lastInferenceAt = now
    this.inferenceInFlight = true

    if (!this.canvas) {
      this.canvas = document.createElement("canvas")
    }
    // Resize frame capture to a lightweight working resolution (e.g. 384x288)
    const scale = Math.min(1.0, 384 / Math.max(vw, vh))
    this.canvas.width = Math.round(vw * scale)
    this.canvas.height = Math.round(vh * scale)

    const ctx = this.canvas.getContext("2d")
    if (!ctx) {
      this.inferenceInFlight = false
      return null
    }
    ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height)

    const frameSeq = ++this.frameSequence

    // Primary transport: Persistent WebSocket
    if (defaultMirageBridge.isConnected()) {
      try {
        const dataUrl = this.canvas.toDataURL("image/jpeg", 0.78)
        const sent = defaultMirageBridge.sendVisionFrame(dataUrl, "sign_language", frameSeq)
        if (sent) {
          // Bounded timeout so in-flight lock doesn't get stuck if server drops frame
          setTimeout(() => {
            this.inferenceInFlight = false
          }, 350)
          return null
        }
      } catch {
        // Fall back to HTTP below
      }
    }

    // Secondary transport: HTTP POST fallback
    this.canvas.toBlob(
      async (blob) => {
        try {
          if (!blob) return
          const form = new FormData()
          form.append("file", blob, "frame.jpg")

          const startTime = performance.now()
          const response = await fetch(this.inferenceEndpoint, {
            method: "POST",
            body: form,
            signal: AbortSignal.timeout(2500),
          })
          const latencyMs = Math.round(performance.now() - startTime)

          if (!response.ok) return
          const data = await response.json()

          if (data.status === "no_hand") {
            this.handleNoHand()
            return
          }

          if (data.status !== "ok" || !data.sign_id) {
            return
          }

          this.handleValidPrediction(data, latencyMs)
        } catch {
          // Handled gracefully
        } finally {
          this.inferenceInFlight = false
        }
      },
      "image/jpeg",
      0.78,
    )

    return null
  }

  private handleWsPayload(payload: ArabicSignPayload): void {
    this.inferenceInFlight = false

    if (payload.status === "no_hand") {
      this.handleNoHand()
      return
    }

    if (payload.status === "ok" && payload.sign_id) {
      this.handleValidPrediction(payload, payload.inference_ms || 25)
    }
  }

  private handleNoHand(): void {
    this.consecutiveNoHand++
    this.consecutiveMatchingFrames = 0
    const now = Date.now()

    // Clean old temporal buffer
    this.rollingWindow = this.rollingWindow.filter((d) => now - d.timestamp < 700)

    // Robust neutral re-arming:
    // Hand must be withdrawn / no hand for at least 3 consecutive frames (~350ms)
    // before unlocking the previous sign to be signed again.
    if (this.consecutiveNoHand >= 3) {
      this.lockedSign = null
      this.lastConfirmedSign = null
    }

    const provisionalResult: ArabicSignResult = {
      signId: "none",
      arabicLabel: "",
      glossArabic: "",
      confidence: 0,
      timestamp: now,
      isProvisional: true,
      isConfirmed: false,
      state: "no_hand",
    }
    this.predictionListeners.forEach((l) => l(provisionalResult))
  }

  private handleValidPrediction(data: any, latencyMs: number): void {
    this.consecutiveNoHand = 0
    const now = Date.now()
    const raw: RawDetection = {
      signId: data.sign_id,
      arabicLabel: data.arabic_label,
      glossArabic: data.gloss_arabic,
      confidence: Number(data.confidence) || 0,
      timestamp: now,
    }

    // Add to rolling window and prune items older than 900ms
    this.rollingWindow.push(raw)
    this.rollingWindow = this.rollingWindow.filter((d) => now - d.timestamp < 900)

    const spokenMeta = ARSL_SPOKEN_MAP[raw.signId]
    const spokenLabel = spokenMeta ? spokenMeta.spokenAr : (data.spoken_arabic || raw.arabicLabel)

    // Count recent agreeing detections in window
    const matchingVotes = this.rollingWindow.filter((d) => d.signId === raw.signId)
    const isStable = matchingVotes.length >= 3
    const passesConfidence = raw.confidence >= this.confidenceThreshold

    // STRICT ANTI-LOOP & HYSTERESIS RULES:
    // 1. If currently locked on the SAME sign, it CANNOT confirm again while held!
    const isSameAsLocked = raw.signId === this.lockedSign
    // 2. Cooldown between successive confirmed signs
    const passesCooldown = now - this.lastConfirmedTime >= this.cooldownMs

    if (passesConfidence && isStable && !isSameAsLocked && (passesCooldown || raw.signId !== this.lastConfirmedSign)) {
      // NEW DISTINCT STABLE SIGN CONFIRMED:
      // Lock it so it will NEVER repeat while the user holds the hand!
      this.lockedSign = raw.signId
      this.lastConfirmedSign = raw.signId
      this.lastConfirmedTime = now

      const confirmedResult: ArabicSignResult = {
        signId: raw.signId,
        arabicLabel: raw.arabicLabel,
        glossArabic: raw.glossArabic,
        spokenLabel,
        confidence: Number(raw.confidence.toFixed(2)),
        timestamp: now,
        isProvisional: false,
        isConfirmed: true,
        inferenceMs: latencyMs,
        state: "confirmed",
      }

      this.predictionListeners.forEach((listener) => listener(confirmedResult))
    } else {
      // Provisional feedback (displays real-time recognized character without appending or speaking)
      const provisionalResult: ArabicSignResult = {
        signId: raw.signId,
        arabicLabel: raw.arabicLabel,
        glossArabic: raw.glossArabic,
        spokenLabel,
        confidence: Number(raw.confidence.toFixed(2)),
        timestamp: now,
        isProvisional: true,
        isConfirmed: false,
        inferenceMs: latencyMs,
        state: isSameAsLocked
          ? "recognizing" // Stable & holding
          : passesConfidence
            ? "recognizing"
            : raw.confidence < 0.45
              ? "unrecognized"
              : "uncertain",
      }

      this.predictionListeners.forEach((listener) => listener(provisionalResult))
    }
  }

  private notifyStatus(): void {
    this.statusListeners.forEach((l) => l(this.status, this.statusLabel))
  }
}

export const arabicSignService = new ArabicSignRecognitionService()
