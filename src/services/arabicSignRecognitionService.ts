/**
 * MIRAGE AI - Arabic Sign Recognition Service (Integration Interface)
 *
 * RESERVED FOR FUTURE MODEL 1: MobileNetV2 — Arabic Sign Language (ArSL)
 *
 * Current Status: Awaiting Arabic model integration
 * Neither weights nor class labels are currently installed.
 * This service provides a model-independent integration contract for when
 * the trained MobileNetV2 ArSL model is provided.
 */

import type { ArabicSignResult, ModelIntegrationStatus } from "@/types/mirage"

export interface ArabicModelConfig {
  weightsPath?: string
  classesPath?: string
  /** A real Arabic-sign inference endpoint supplied with a matching checkpoint. */
  inferenceEndpoint?: string
  inputShape?: [number, number, number, number] // e.g. [1, 3, 224, 224]
  confidenceThreshold?: number
}

type PredictionListener = (result: ArabicSignResult) => void
type StatusListener = (status: ModelIntegrationStatus, label: string) => void

export class ArabicSignRecognitionService {
  private status: ModelIntegrationStatus = "awaiting_integration"
  private statusLabel = "Awaiting Arabic model integration"
  private predictionListeners = new Set<PredictionListener>()
  private statusListeners = new Set<StatusListener>()
  private inferenceEndpoint: string | null = null
  private lastInferenceAt = 0
  private inferenceInFlight = false

  public getStatus(): ModelIntegrationStatus {
    return this.status
  }

  public getStatusLabel(): string {
    return this.statusLabel
  }

  public isReady(): boolean {
    return this.status === "ready"
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
   * Model initialization contract.
   * Currently marks the service as awaiting integration until weights are provided.
   */
  public async initialize(config?: ArabicModelConfig): Promise<boolean> {
    // MobileNetV2 ImageNet weights are deliberately not accepted here: an
    // Arabic-specific checkpoint and ordered class map are both required.
    if (
      !config?.weightsPath ||
      !config.classesPath ||
      !config.inferenceEndpoint
    ) {
      this.status = "awaiting_integration"
      this.statusLabel =
        "Awaiting verified Arabic-specific MobileNetV2 checkpoint and class map"
      this.notifyStatus()
      return false
    }
    this.inferenceEndpoint = config.inferenceEndpoint
    this.status = "initializing"
    this.statusLabel = "Checking Arabic sign model endpoint"
    this.notifyStatus()
    try {
      const response = await fetch(
        `${this.inferenceEndpoint.replace(/\/predict$/, "")}/health`,
      )
      const health = await response.json()
      if (!response.ok || !health.available)
        throw new Error("Arabic model assets are unavailable")
      this.status = "ready"
      this.statusLabel = "Arabic sign CNN ready (32 static ArSL classes)"
      this.notifyStatus()
      return true
    } catch (error) {
      this.status = "error"
      this.statusLabel = `Arabic sign model unavailable: ${
        error instanceof Error ? error.message : "connection failed"
      }`
      this.notifyStatus()
      return false
    }
  }

  /**
   * Frame processing contract.
   * Once MobileNetV2 is integrated, preprocessed video frames will pass through here.
   */
  public processVideoFrame(
    videoElement: HTMLVideoElement | null,
  ): ArabicSignResult | null {
    if (!this.isReady() || !videoElement) {
      // Model not yet integrated; no prediction is fabricated.
      return null
    }

    const now = Date.now()
    if (this.inferenceInFlight || now - this.lastInferenceAt < 150) return null
    this.lastInferenceAt = now
    this.inferenceInFlight = true
    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    canvas.getContext("2d")?.drawImage(videoElement, 0, 0)
    void canvas.toBlob(
      async (blob) => {
        try {
          if (!blob || !this.inferenceEndpoint) return
          const form = new FormData()
          form.append("file", blob, "frame.jpg")
          const response = await fetch(this.inferenceEndpoint, {
            method: "POST",
            body: form,
          })
          const data = await response.json()
          if (!response.ok || data.status !== "ok") return
          const result: ArabicSignResult = {
            signId: data.sign_id,
            arabicLabel: data.arabic_label,
            glossArabic: data.gloss_arabic,
            confidence: data.confidence,
            timestamp: Date.now(),
            isProvisional: data.confidence < (this as any).confidenceThreshold,
            isConfirmed: data.confidence >= (this as any).confidenceThreshold,
          }
          this.predictionListeners.forEach((listener) => listener(result))
        } catch {
          // Network errors are represented by service status at initialization;
          // an individual failed frame must not create a fabricated prediction.
        } finally {
          this.inferenceInFlight = false
        }
      },
      "image/jpeg",
      0.85,
    )
    return null
  }

  private notifyStatus() {
    this.statusListeners.forEach((l) => l(this.status, this.statusLabel))
  }
}

export const arabicSignService = new ArabicSignRecognitionService()
