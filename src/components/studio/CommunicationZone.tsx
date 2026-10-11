"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Globe,
  ArrowRight,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Send,
  Mic,
  Square,
  Sparkles,
  Command,
  Info,
  Type,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react"
import {
  useMirageStore,
  SIGN_LANGUAGES,
  SPOKEN_LANGUAGES,
} from "@/store/mirageStore"
import { speechService } from "@/services/speechService"
import { useMicrophone } from "@/hooks/useMicrophone"
import AudioWaveform from "./AudioWaveform"
import type { MultimodalMessage, SignLanguageCode, SpokenLanguageCode } from "@/types/mirage"

export default function CommunicationZone() {
  const currentSignTokens = useMirageStore((s) => s.currentSignTokens)
  const removeSignToken = useMirageStore((s) => s.removeSignToken)
  const clearSignDraft = useMirageStore((s) => s.clearSignDraft)
  const clearArabicDraft = useMirageStore((s) => s.clearArabicDraft)
  const accumulatedArabicSigns = useMirageStore((s) => s.accumulatedArabicSigns)
  const arabicTranscript = useMirageStore((s) => s.arabicTranscript)
  const addMessage = useMirageStore((s) => s.addMessage)
  const messages = useMirageStore((s) => s.messages)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setSpeakingState = useMirageStore((s) => s.setSpeakingState)
  const setVoiceListeningState = useMirageStore((s) => s.setVoiceListeningState)
  const cameraActive = useMirageStore((s) => s.cameraActive)

  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  const [inputVal, setInputVal] = useState("")
  const [copied, setCopied] = useState(false)
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [micTranscript, setMicTranscript] = useState("")
  const [activeTab, setActiveTab] = useState<"translate" | "history">("translate")

  const { start: startMicAmp, stop: stopMicAmp, amplitude: micAmplitude } = useMicrophone()

  // Arabic translated sentence derived from recognized tokens or transcript
  const activeArabicSentence = useMemo(() => {
    if (arabicTranscript.trim()) return arabicTranscript.trim()
    if (accumulatedArabicSigns.length > 0) return accumulatedArabicSigns.join(" ")
    if (currentSignTokens.length > 0) {
      return currentSignTokens.map((t) => t.arabicLabel || t.gloss || t.token).join(" ")
    }
    return ""
  }, [arabicTranscript, accumulatedArabicSigns, currentSignTokens])

  const isRTL = settings.spokenLanguage === "ar"

  // Speak translation aloud in Arabic (or target spoken language)
  const handleSpeakTranslation = async () => {
    const textToSpeak = activeArabicSentence || inputVal.trim()
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

  // Confirm sentence & add to conversation history
  const handleConfirmSentence = () => {
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
      void handleSpeakVoiceFeedback(textToSubmit)
    }
  }

  const handleSpeakVoiceFeedback = async (text: string) => {
    setSpeakingState(true)
    await speechService.speak(text, settings.spokenLanguage, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      onEnd: () => setSpeakingState(false),
      onError: () => setSpeakingState(false),
    })
  }

  // Copy translated text
  const handleCopy = () => {
    if (!activeArabicSentence) return
    void navigator.clipboard.writeText(activeArabicSentence)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  // Toggle voice input for hearing partner
  const toggleVoiceInput = () => {
    if (isListeningMic) {
      speechService.stopListening()
      stopMicAmp()
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

        setTimeout(async () => {
          const reply =
            settings.spokenLanguage === "ar"
              ? "تم استلام رسالتك الصوتية بوضوح."
              : settings.spokenLanguage === "fr"
                ? "Message vocal bien reçu."
                : "Voice message received."

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
      void startMicAmp()

      const started = speechService.startListening(
        settings.spokenLanguage,
        (text) => setMicTranscript(text),
        () => {
          setIsListeningMic(false)
          stopMicAmp()
          setVoiceListeningState(false)
        },
      )

      if (!started) {
        setIsListeningMic(false)
        stopMicAmp()
        setVoiceListeningState(false)
      }
    }
  }

  // Send typed text message
  const handleSendText = async () => {
    const text = inputVal.trim()
    if (!text) return

    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      source: "typed",
      content: text,
      timestamp: new Date(),
      language: settings.spokenLanguage,
      isRTL,
    })

    setInputVal("")

    setTimeout(async () => {
      const reply =
        settings.spokenLanguage === "ar"
          ? `أهلاً بك! وصلتني رسالتك: "${text}".`
          : settings.spokenLanguage === "fr"
            ? `Bien reçu : "${text}".`
            : `Received: "${text}".`

      addMessage({
        id: crypto.randomUUID(),
        role: "mirage",
        source: "avatar",
        content: reply,
        confidence: 0.99,
        timestamp: new Date(),
        language: settings.spokenLanguage,
        isRTL,
      })

      if (settings.autoSpeak) {
        setSpeakingState(true)
        await speechService.speak(reply, settings.spokenLanguage, {
          onEnd: () => setSpeakingState(false),
          onError: () => setSpeakingState(false),
        })
      }
    }, 600)
  }

  // Render origin badge
  const renderOriginBadge = (source: MultimodalMessage["source"]) => {
    switch (source) {
      case "arabic_sign":
      case "sign":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#5EEAD4] bg-[#5EEAD4]/10 border border-[#5EEAD4]/25 px-2 py-0.5 rounded-full">
            <span>🤟</span> Arabic Sign (ArSL)
          </span>
        )
      case "speech":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-0.5 rounded-full">
            <Mic size={10} /> Spoken Audio
          </span>
        )
      case "typed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-white/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            <Type size={10} /> Typed Message
          </span>
        )
      case "avatar":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/25 px-2 py-0.5 rounded-full">
            <Sparkles size={10} /> MIRA Companion
          </span>
        )
      case "command":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#FB923C] bg-[#FB923C]/10 border border-[#FB923C]/25 px-2 py-0.5 rounded-full">
            <Command size={10} /> Gesture Command
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-white/40 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
            <Info size={10} /> System
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col h-full rounded-3xl bg-[#12141A] border border-white/[0.08] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] justify-between gap-3 overflow-hidden">
      {/* Header: Language Selector & Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] gap-2">
        {/* Language Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <Globe size={14} className="text-[#5EEAD4] shrink-0" />
          <select
            value={settings.signLanguage}
            onChange={(e) =>
              updateSettings({
                signLanguage: e.target.value as SignLanguageCode,
              })
            }
            className="bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-white/90 text-xs outline-none"
          >
            {SIGN_LANGUAGES.map((sl) => (
              <option key={sl.code} value={sl.code} className="bg-[#11151A]">
                {sl.nativeName}
              </option>
            ))}
          </select>

          <ArrowRight size={11} className="text-white/30 shrink-0" />

          <select
            value={settings.spokenLanguage}
            onChange={(e) =>
              updateSettings({
                spokenLanguage: e.target.value as SpokenLanguageCode,
              })
            }
            className="bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-white/90 text-xs outline-none"
          >
            {SPOKEN_LANGUAGES.map((sp) => (
              <option key={sp.code} value={sp.code} className="bg-[#11151A]">
                {sp.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher: Live Arabic Draft vs History */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/5">
          <button
            onClick={() => setActiveTab("translate")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer ${
              activeTab === "translate"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Arabic Draft
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer ${
              activeTab === "history"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            History ({messages.length})
          </button>
        </div>
      </div>

      {/* Main Body */}
      {activeTab === "translate" ? (
        <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden">
          {/* Sign Sequence Tokens Stream */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <span>لغة الإشارة العربية (ArSL)</span>
                <span className="text-white/20">·</span>
                <span className="text-amber-400/80">MobileNetV2</span>
              </span>
              {(currentSignTokens.length > 0 || accumulatedArabicSigns.length > 0) && (
                <button
                  onClick={() => {
                    clearArabicDraft()
                    clearSignDraft()
                  }}
                  className="text-[10px] font-mono text-white/40 hover:text-white/80 flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw size={10} /> Clear Draft
                </button>
              )}
            </div>

            <div
              className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 rounded-2xl bg-black/40 border border-white/5"
              dir="rtl"
            >
              {currentSignTokens.length === 0 && accumulatedArabicSigns.length === 0 ? (
                <div className="flex items-center gap-2 px-1 text-xs text-white/30 font-light italic">
                  <Clock size={12} className="text-amber-400/60 shrink-0" />
                  <span>في انتظار دمج نموذج MobileNetV2 للتعرف على إشارات لغة الإشارة العربية…</span>
                </div>
              ) : (
                currentSignTokens.map((tok) => (
                  <motion.div
                    key={tok.id}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 text-xs text-[#5EEAD4]"
                  >
                    <span className="font-medium text-sm">{tok.arabicLabel || tok.gloss}</span>
                    <span className="text-[9px] font-mono text-white/40">
                      {Math.round(tok.confidence * 100)}%
                    </span>
                    <button
                      onClick={() => removeSignToken(tok.id)}
                      className="text-white/40 hover:text-white mr-1 cursor-pointer"
                      title="Remove token"
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Arabic Sign Output Area */}
          <div className="flex-1 flex flex-col justify-between p-3.5 rounded-2xl bg-black/30 border border-white/5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5EEAD4]/80 flex items-center gap-1">
                  <Sparkles size={11} /> النص العربي المترجم:
                </span>
                {activeArabicSentence && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4]">
                    READY
                  </span>
                )}
              </div>

              <div
                className={`min-h-[50px] text-base leading-relaxed ${
                  activeArabicSentence ? "text-white/95" : "text-white/30 italic"
                } text-right font-sans`}
                dir="rtl"
              >
                {activeArabicSentence || "المخرجات اللفظية للغة الإشارة العربية ستظهر هنا مباشرة…"}
              </div>
            </div>

            {/* Action Buttons: Speak, Copy, Confirm */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSpeakTranslation}
                  disabled={!activeArabicSentence || isAudioPlaying}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeArabicSentence
                      ? "bg-[#5EEAD4]/15 hover:bg-[#5EEAD4]/25 text-[#5EEAD4] border border-[#5EEAD4]/30"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <Volume2 size={13} className={isAudioPlaying ? "animate-pulse" : ""} />
                  <span>{isAudioPlaying ? "جاري النطق…" : "نطق صوتي"}</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!activeArabicSentence}
                  className={`p-1.5 rounded-xl text-xs transition border cursor-pointer ${
                    activeArabicSentence
                      ? "bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
                      : "bg-white/5 text-white/20 border-transparent cursor-not-allowed"
                  }`}
                  title="نسخ النص"
                >
                  {copied ? <Check size={13} className="text-[#5EEAD4]" /> : <Copy size={13} />}
                </button>
              </div>

              <button
                onClick={handleConfirmSentence}
                disabled={!activeArabicSentence}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-medium transition shadow-md cursor-pointer ${
                  activeArabicSentence
                    ? "bg-[#5EEAD4] text-black hover:bg-[#3DDBB5]"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                }`}
              >
                <span>تأكيد الإرسال</span>
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* History Stream View */
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 max-h-[220px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {renderOriginBadge(msg.source)}
                <span className="text-[9px] font-mono text-white/30">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div
                className={`p-2.5 rounded-2xl text-xs font-light max-w-[90%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0F1E24] border border-[#5EEAD4]/20 text-white/95"
                    : "bg-[#131923] border border-white/10 text-white/95"
                }`}
                dir={msg.isRTL ? "rtl" : "ltr"}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Voice Activity Waveform Banner (When Recording) */}
      {isListeningMic && (
        <div className="p-2.5 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="text-xs text-[#22D3EE] font-mono">
              Listening: {micTranscript ? `"${micTranscript}"` : "Speak aloud in Arabic…"}
            </span>
          </div>
          <AudioWaveform amplitude={micAmplitude.get()} active={true} barCount={12} color="#22D3EE" />
        </div>
      )}

      {/* Voice & Text Composer Bar */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
        {/* Mic Toggle Button */}
        <button
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-2xl border transition cursor-pointer ${
            isListeningMic
              ? "bg-[#22D3EE] text-black border-[#22D3EE] shadow-[0_0_12px_rgba(34,211,238,0.4)]"
              : "bg-white/5 text-white/70 hover:text-white border-white/10"
          }`}
          title={isListeningMic ? "إيقاف التسجيل الصوتي" : "تحدث عبر الميكروفون"}
        >
          {isListeningMic ? <Square size={14} /> : <Mic size={14} />}
        </button>

        {/* Text Input */}
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendText()
          }}
          placeholder="اكتب رسالة للترجمة أو الرد على الإشارات…"
          className="flex-1 bg-black/40 border border-white/10 focus:border-[#5EEAD4]/50 rounded-2xl px-3.5 py-2 text-xs text-white/90 outline-none transition placeholder:text-white/25 text-right font-sans"
          dir="rtl"
        />

        {/* Send Button */}
        <button
          onClick={handleSendText}
          disabled={!inputVal.trim()}
          className={`p-2 rounded-2xl border transition cursor-pointer ${
            inputVal.trim()
              ? "bg-[#5EEAD4] text-black border-[#5EEAD4] hover:bg-[#3DDBB5]"
              : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed"
          }`}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
