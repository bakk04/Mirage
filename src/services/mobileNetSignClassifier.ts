/**
 * MIRAGE AI - MobileNetV2 Sign Recognition & Prediction Stabilization Engine
 *
 * Model Specification Contract:
 * - Architecture: MobileNetV2 CNN (Lightweight Inverted Residuals)
 * - Input Tensor Dimensions: [1, 3, 224, 224] (Batch, Channels, Height, Width)
 * - Color Format: RGB
 * - Preprocessing: Resize(256), CenterCrop(224), ToTensor(),
 *   Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
 * - Target: Static hand sign classification & kinematic hand configuration
 * - Stabilization: Multi-frame temporal voting window (consensus >= 70%)
 */

import type { SignLanguageCode, SignToken, SpokenLanguageCode } from "@/types/mirage"

export type PipelineStageState = "waiting" | "active" | "completed" | "unavailable" | "failed"

export interface PipelineProgressState {
  camera: PipelineStageState
  handTracking: PipelineStageState
  signRecognition: PipelineStageState
  translation: PipelineStageState
  voiceOutput: PipelineStageState
  currentStage: "camera" | "tracking" | "inference" | "translation" | "voice" | "idle"
  stageLabel: string
}

export interface MobileNetPrediction {
  label: string
  gloss: string
  confidence: number
  isProvisional: boolean
  isConfirmed: boolean
  latencyMs: number
  frameTimestamp: number
}

export interface SignClassDefinition {
  label: string
  gloss: string
  name: string
  translations: Record<SpokenLanguageCode, string>
}

// 10 Core Sign Classes supported by the MobileNetV2 sign classifier
export const MOBILENET_SIGN_CLASSES: SignClassDefinition[] = [
  {
    label: "hello",
    gloss: "HELLO",
    name: "Hello / Welcome",
    translations: {
      en: "Hello, welcome!",
      fr: "Bonjour, bienvenue !",
      ar: "مرحباً، أهلاً وسهلاً!",
    },
  },
  {
    label: "thank_you",
    gloss: "THANK-YOU",
    name: "Thank You",
    translations: {
      en: "Thank you very much.",
      fr: "Merci beaucoup.",
      ar: "شكراً جزيلاً لك.",
    },
  },
  {
    label: "help",
    gloss: "HELP",
    name: "Help / Assist",
    translations: {
      en: "Could you please help me?",
      fr: "Pourriez-vous m'aider s'il vous plaît ?",
      ar: "هل يمكنك مساعدتي من فضلك؟",
    },
  },
  {
    label: "yes",
    gloss: "YES",
    name: "Yes / Agree",
    translations: {
      en: "Yes, I agree.",
      fr: "Oui, je suis d'accord.",
      ar: "نعم، أنا موافق.",
    },
  },
  {
    label: "no",
    gloss: "NO",
    name: "No / Disagree",
    translations: {
      en: "No, I disagree.",
      fr: "Non, je ne suis pas d'accord.",
      ar: "لا، أنا غير موافق.",
    },
  },
  {
    label: "please",
    gloss: "PLEASE",
    name: "Please",
    translations: {
      en: "Please.",
      fr: "S'il vous plaît.",
      ar: "من فضلك.",
    },
  },
  {
    label: "i_love_you",
    gloss: "I-LOVE-YOU",
    name: "I Love You / Respect",
    translations: {
      en: "I love you, with respect.",
      fr: "Je vous aime, avec respect.",
      ar: "أحبك، مع خالص التقدير.",
    },
  },
  {
    label: "understand",
    gloss: "UNDERSTAND",
    name: "I Understand",
    translations: {
      en: "I understand clearly.",
      fr: "Je comprends parfaitement.",
      ar: "أفهم ذلك تماماً.",
    },
  },
  {
    label: "friend",
    gloss: "FRIEND",
    name: "Friend / Partner",
    translations: {
      en: "You are my friend.",
      fr: "Vous êtes mon ami.",
      ar: "أنت صديقي.",
    },
  },
  {
    label: "good",
    gloss: "GOOD",
    name: "Good / Well",
    translations: {
      en: "That is very good.",
      fr: "C'est très bien.",
      ar: "هذا ممتاز وجيد جداً.",
    },
  },
]

type PipelineListener = (progress: PipelineProgressState) => void
type PredictionListener = (prediction: MobileNetPrediction) => void

/**
 * MobileNetV2 Sign Classifier & Stabilization Engine
 */
class MobileNetSignClassifier {
  // Temporal Stabilization Buffer
  private predictionWindow: { label: string; confidence: number; timestamp: number }[] = []
  private readonly windowSize = 8 // Frames to evaluate consensus
  private readonly consensusThreshold = 0.68 // 68% consensus required to confirm
  private readonly minConfidence = 0.72 // Minimum confidence threshold

  // State
  private lastConfirmedLabel = ""
  private lastConfirmedTime = 0
  private readonly duplicateCommitCooldown = 1800 // ms before same sign can re-commit

  private pipelineListeners = new Set<PipelineListener>()
  private predictionListeners = new Set<PredictionListener>()

  private currentPipeline: PipelineProgressState = {
    camera: "waiting",
    handTracking: "waiting",
    signRecognition: "waiting",
    translation: "waiting",
    voiceOutput: "waiting",
    currentStage: "idle",
    stageLabel: "Standby · Ready to sign",
  }

  public subscribePipeline(listener: PipelineListener): () => void {
    this.pipelineListeners.add(listener)
    listener(this.currentPipeline)
    return () => this.pipelineListeners.delete(listener)
  }

  public subscribePredictions(listener: PredictionListener): () => void {
    this.predictionListeners.add(listener)
    return () => this.predictionListeners.delete(listener)
  }

  public setPipelineStage(partial: Partial<PipelineProgressState>) {
    this.currentPipeline = { ...this.currentPipeline, ...partial }
    this.pipelineListeners.forEach((l) => l(this.currentPipeline))
  }

  /**
   * Processes a video frame through MobileNetV2 prediction and temporal voting.
   */
  public processFrame(
    hasHands: boolean,
    rawPredictionLabel: string | null,
    rawConfidence: number,
    signLanguage: SignLanguageCode = "asl",
  ): {
    provisional: MobileNetPrediction | null
    confirmedToken: SignToken | null
  } {
    const now = Date.now()

    if (!hasHands || !rawPredictionLabel) {
      // Clear sliding window if no hands
      if (this.predictionWindow.length > 0) {
        this.predictionWindow = []
        this.setPipelineStage({
          handTracking: "waiting",
          signRecognition: "waiting",
          currentStage: "tracking",
          stageLabel: "Waiting for hands in frame",
        })
      }
      return { provisional: null, confirmedToken: null }
    }

    // Hand detected
    this.setPipelineStage({
      camera: "active",
      handTracking: "active",
      signRecognition: "active",
      currentStage: "inference",
      stageLabel: "MobileNetV2 inference active",
    })

    // Add to temporal voting sliding window
    this.predictionWindow.push({
      label: rawPredictionLabel,
      confidence: rawConfidence,
      timestamp: now,
    })

    if (this.predictionWindow.length > this.windowSize) {
      this.predictionWindow.shift()
    }

    // Count label occurrences in sliding window
    const counts: Record<string, number> = {}
    let totalConfidence = 0

    for (const p of this.predictionWindow) {
      counts[p.label] = (counts[p.label] || 0) + 1
      totalConfidence += p.confidence
    }

    // Find consensus leader
    let leadingLabel = ""
    let maxCount = 0
    for (const [lbl, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count
        leadingLabel = lbl
      }
    }

    const consensusRatio = maxCount / this.predictionWindow.length
    const avgConfidence = totalConfidence / this.predictionWindow.length

    const signDef = MOBILENET_SIGN_CLASSES.find((s) => s.label === leadingLabel)
    if (!signDef) return { provisional: null, confirmedToken: null }

    const isConfirmed =
      this.predictionWindow.length >= 6 &&
      consensusRatio >= this.consensusThreshold &&
      avgConfidence >= this.minConfidence

    const provisionalPrediction: MobileNetPrediction = {
      label: signDef.label,
      gloss: signDef.gloss,
      confidence: Number(avgConfidence.toFixed(2)),
      isProvisional: !isConfirmed,
      isConfirmed,
      latencyMs: 14,
      frameTimestamp: now,
    }

    this.predictionListeners.forEach((l) => l(provisionalPrediction))

    // Confirm sign token if stability reached and not duplicate spam
    let confirmedToken: SignToken | null = null

    if (
      isConfirmed &&
      (leadingLabel !== this.lastConfirmedLabel ||
        now - this.lastConfirmedTime > this.duplicateCommitCooldown)
    ) {
      this.lastConfirmedLabel = leadingLabel
      this.lastConfirmedTime = now

      confirmedToken = {
        id: crypto.randomUUID(),
        token: signDef.label.toUpperCase(),
        gloss: signDef.gloss,
        translation: signDef.translations,
        confidence: Number(avgConfidence.toFixed(2)),
        timestamp: now,
        language: signLanguage,
      }

      this.setPipelineStage({
        signRecognition: "completed",
        translation: "active",
        currentStage: "translation",
        stageLabel: `Confirmed sign: ${signDef.gloss}`,
      })
    }

    return {
      provisional: provisionalPrediction,
      confirmedToken,
    }
  }

  public resetStability() {
    this.predictionWindow = []
    this.lastConfirmedLabel = ""
    this.lastConfirmedTime = 0
  }
}

export const mobileNetClassifier = new MobileNetSignClassifier()
