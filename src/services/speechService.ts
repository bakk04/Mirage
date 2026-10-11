/**
 * MIRAGE AI - Multilingual Speech Synthesis & Recognition Service
 * Supports English, French, and Arabic with avatar-synchronized events.
 */

import type { SpokenLanguageCode } from "@/types/mirage"

export interface SpeechSynthesisOptions {
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: unknown) => void
}

type AmplitudeListener = (amp: number) => void

class SpeechService {
  private synth: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private recognitionInstance: any = null
  private isListening = false
  private amplitudeListeners = new Set<AmplitudeListener>()
  private speechAnimFrame: number | null = null
  private speechStartTime = 0

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis
    }
  }

  public subscribeAmplitude(listener: AmplitudeListener): () => void {
    this.amplitudeListeners.add(listener)
    return () => this.amplitudeListeners.delete(listener)
  }

  private notifyAmplitude(val: number) {
    this.amplitudeListeners.forEach((l) => l(val))
  }

  private startSpeechCadence() {
    this.speechStartTime = performance.now()
    const tick = () => {
      if (!this.synth?.speaking) {
        this.notifyAmplitude(0)
        this.speechAnimFrame = null
        return
      }

      const elapsed = (performance.now() - this.speechStartTime) * 0.001
      // Natural human speech cadence rhythm: primary syllable rate (4.5 Hz) modulated by phrase pauses
      const syllable = Math.sin(elapsed * 28) * 0.5 + 0.5
      const phrase = Math.sin(elapsed * 4.2) * 0.5 + 0.5
      const rawAmp = syllable * 0.7 + phrase * 0.3
      const dipped = phrase > 0.15 ? rawAmp * 0.85 : 0.05

      this.notifyAmplitude(Number(dipped.toFixed(2)))
      this.speechAnimFrame = requestAnimationFrame(tick)
    }
    this.speechAnimFrame = requestAnimationFrame(tick)
  }

  private stopSpeechCadence() {
    if (this.speechAnimFrame) {
      cancelAnimationFrame(this.speechAnimFrame)
      this.speechAnimFrame = null
    }
    this.notifyAmplitude(0)
  }

  /**
   * Synthesizes speech in the requested target language.
   */
  public speak(
    text: string,
    language: SpokenLanguageCode = "en",
    options: SpeechSynthesisOptions = {},
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        options.onError?.("Speech synthesis not supported in this browser.")
        resolve()
        return
      }

      // Cancel any ongoing speech
      this.stopSpeaking()

      const langTagMap: Record<SpokenLanguageCode, string> = {
        en: "en-US",
        fr: "fr-FR",
        ar: "ar-SA",
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = langTagMap[language] || "en-US"
      utterance.rate = options.rate ?? 0.95
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0

      // Try to find a matching high-quality voice
      const voices = this.synth.getVoices()
      const matchingVoice =
        voices.find(
          (v) =>
            v.lang.startsWith(langTagMap[language].slice(0, 2)) &&
            (v.name.includes("Natural") ||
              v.name.includes("Siri") ||
              v.name.includes("Google")),
        ) ||
        voices.find((v) => v.lang.startsWith(langTagMap[language].slice(0, 2)))

      if (matchingVoice) {
        utterance.voice = matchingVoice
      }

      utterance.onstart = () => {
        options.onStart?.()
        this.startSpeechCadence()
      }

      utterance.onend = () => {
        this.currentUtterance = null
        this.stopSpeechCadence()
        options.onEnd?.()
        resolve()
      }

      utterance.onerror = (e) => {
        this.currentUtterance = null
        this.stopSpeechCadence()
        options.onError?.(e)
        resolve()
      }

      this.currentUtterance = utterance
      this.synth.speak(utterance)
    })
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel()
      this.currentUtterance = null
    }
    this.stopSpeechCadence()
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false
  }

  /**
   * Starts speech-to-text recognition for hearing users.
   */
  public startListening(
    language: SpokenLanguageCode = "en",
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
  ): boolean {
    if (typeof window === "undefined") return false

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      onError("Web Speech Recognition API is unavailable in this browser.")
      return false
    }

    try {
      this.stopListening()

      const recognition = new SpeechRecognition()
      const langTagMap: Record<SpokenLanguageCode, string> = {
        en: "en-US",
        fr: "fr-FR",
        ar: "ar-SA",
      }

      recognition.lang = langTagMap[language] || "en-US"
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true)
        } else if (interimTranscript) {
          onResult(interimTranscript, false)
        }
      }

      recognition.onerror = (event: any) => {
        onError(event.error || "Speech recognition error")
        this.isListening = false
      }

      recognition.onend = () => {
        this.isListening = false
      }

      recognition.start()
      this.recognitionInstance = recognition
      this.isListening = true
      return true
    } catch (e: any) {
      onError(e.message || "Failed to initialize microphone")
      return false
    }
  }

  public stopListening() {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop()
      } catch {
        // Ignore if already stopped
      }
      this.recognitionInstance = null
    }
    this.isListening = false
  }

  public getIsListening(): boolean {
    return this.isListening
  }
}

export const speechService = new SpeechService()
