"use client"

// Arabic translated sentence derived from recognized tokens or transcript

// Speak translation aloud in Arabic (or target spoken language)

// Confirm sentence & add to conversation history

// Copy translated text

// Toggle voice input for hearing partner

// Send typed text message

// Render origin badge
/* ── Header: Language Pipeline Selector & View Tabs ── */ /* Language Pairing */ /* View Switcher: Live Arabic Draft vs History */ /* ── Main Body ── */ /* Sign Sequence Tokens Stream */ /* Arabic Translated Output Box */ /* Action Bar */ /* Audio TTS Button */ /* Copy Button */ /* Confirm & Send Button */
/* History Stream View */ /* Live Voice Activity Banner (When Recording) */ /* ── Voice & Text Composer Bar ── */ /* Mic Toggle Button */ /* Text Input */ /* Send Button */

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
import type {
  MultimodalMessage,
  SignLanguageCode,
  SpokenLanguageCode,
} from "@/types/mirage"

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
  const [activeTab, setActiveTab] = useState<"translate" | "history">(
    "translate",
  )

  const {
    start: startMicAmp,
    stop: stopMicAmp,
    amplitude: micAmplitude,
  } = useMicrophone()
  const activeArabicSentence = useMemo(() => {
    if (arabicTranscript.trim()) return arabicTranscript.trim()
    if (accumulatedArabicSigns.length > 0)
      return accumulatedArabicSigns.join(" ")
    if (currentSignTokens.length > 0) {
      return currentSignTokens
        .map((t) => t.arabicLabel || t.gloss || t.token)
        .join(" ")
    }
    return ""
  }, [arabicTranscript, accumulatedArabicSigns, currentSignTokens])

  const isRTL = settings.spokenLanguage === "ar"
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
  const handleCopy = () => {
    if (!activeArabicSentence) return
    void navigator.clipboard.writeText(activeArabicSentence)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
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
  const renderOriginBadge = (source: MultimodalMessage["source"]) => {
    switch (source) {
      case "arabic_sign":
      case "sign":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#3DDBB5] bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 px-2.5 py-0.5 rounded-full">
            <span>🤟</span> ArSL Arabic Sign
          </span>
        )
      case "speech":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400 bg-sky-500/12 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
            <Mic size={11} /> Spoken Voice
          </span>
        )
      case "typed":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-white/60 bg-white/[0.05] border border-white/10 px-2.5 py-0.5 rounded-full">
            <Type size={11} /> Typed
          </span>
        )
      case "avatar":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#3DDBB5] bg-[#3DDBB5]/15 border border-[#3DDBB5]/35 px-2.5 py-0.5 rounded-full">
            <Sparkles size={11} /> MIRA Companion
          </span>
        )
      case "command":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#F5A25D] bg-[#F5A25D]/12 border border-[#F5A25D]/30 px-2.5 py-0.5 rounded-full">
            <Command size={11} /> Gesture Command
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-white/50 bg-white/[0.05] border border-white/10 px-2.5 py-0.5 rounded-full">
            <Info size={11} /> System
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col h-full rounded-3xl bg-[#1A1D25] border border-white/[0.08] p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.5)] justify-between gap-3 overflow-hidden">
      {}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] gap-2 shrink-0">
        {}
        <div className="flex items-center gap-2 text-xs">
          <Globe size={14} className="text-[#3DDBB5] shrink-0" />
          <select
            value={settings.signLanguage}
            onChange={(e) =>
              updateSettings({
                signLanguage: e.target.value as SignLanguageCode,
              })
            }
            className="bg-[#161920] border border-white/10 rounded-xl px-2.5 py-1 text-white/90 text-xs outline-none focus:border-[#3DDBB5]/50 transition cursor-pointer"
            aria-label="Source sign language"
          >
            {SIGN_LANGUAGES.map((sl) => (
              <option key={sl.code} value={sl.code} className="bg-[#1A1D25]">
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
            className="bg-[#161920] border border-white/10 rounded-xl px-2.5 py-1 text-white/90 text-xs outline-none focus:border-[#3DDBB5]/50 transition cursor-pointer"
            aria-label="Target spoken language"
          >
            {SPOKEN_LANGUAGES.map((sp) => (
              <option key={sp.code} value={sp.code} className="bg-[#1A1D25]">
                {sp.nativeName}
              </option>
            ))}
          </select>
        </div>

        {}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#161920] border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("translate")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "translate"
                ? "bg-[#3DDBB5]/20 text-[#3DDBB5] border border-[#3DDBB5]/40 font-medium"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Arabic Draft
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
              activeTab === "history"
                ? "bg-[#3DDBB5]/20 text-[#3DDBB5] border border-[#3DDBB5]/40 font-medium"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            History ({messages.length})
          </button>
        </div>
      </div>

      {}
      {activeTab === "translate" ? (
        <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden min-h-0">
          {}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-2">
                <span className="text-white/80">تسلسل إشارات ArSL</span>
                <span className="text-white/20">·</span>
                <span className="text-[#3DDBB5]">Arabic Sign Stream</span>
              </span>
              {(currentSignTokens.length > 0 ||
                accumulatedArabicSigns.length > 0) && (
                <button
                  onClick={() => {
                    clearArabicDraft()
                    clearSignDraft()
                  }}
                  className="text-[11px] font-mono text-white/50 hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw size={10} /> Clear Draft
                </button>
              )}
            </div>

            <div
              className="flex flex-wrap items-center gap-2 min-h-[38px] max-h-24 overflow-y-auto p-2 rounded-2xl bg-[#161920] border border-white/[0.06]"
              dir="rtl"
            >
              {currentSignTokens.length === 0 &&
              accumulatedArabicSigns.length === 0 ? (
                <div className="flex items-center gap-2 px-2 text-xs text-white/40 italic font-arabic">
                  <span>في انتظار إشارات لغة الإشارة العربية من الكاميرا…</span>
                </div>
              ) : (
                currentSignTokens.map((tok) => (
                  <motion.div
                    key={tok.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#3DDBB5]/12 border border-[#3DDBB5]/30 text-xs text-[#3DDBB5]"
                  >
                    <span className="font-arabic font-medium text-sm">
                      {tok.arabicLabel || tok.gloss}
                    </span>
                    <span className="text-[10px] font-mono text-white/50">
                      {Math.round(tok.confidence * 100)}%
                    </span>
                    <button
                      onClick={() => removeSignToken(tok.id)}
                      className="text-white/50 hover:text-white mr-1 cursor-pointer"
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

          {}
          <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#161920] border border-white/[0.08] min-h-0 overflow-hidden">
            <div className="overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#3DDBB5] flex items-center gap-1.5 font-medium">
                  <Sparkles size={12} /> النص العربي المترجم:
                </span>
                {activeArabicSentence && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3DDBB5]/15 border border-[#3DDBB5]/30 text-[#3DDBB5] font-medium">
                    TRANSLATION READY
                  </span>
                )}
              </div>

              <div
                className={`text-base sm:text-lg leading-relaxed ${
                  activeArabicSentence
                    ? "text-white font-arabic font-medium"
                    : "text-white/35 font-arabic italic"
                } text-right`}
                dir="rtl"
              >
                {activeArabicSentence ||
                  "المخرجات اللفظية للغة الإشارة ستظهر هنا تلقائياً فور التعرف عليها…"}
              </div>
            </div>

            {}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {}
                <button
                  onClick={handleSpeakTranslation}
                  disabled={!activeArabicSentence || isAudioPlaying}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeArabicSentence
                      ? "bg-[#3DDBB5]/15 hover:bg-[#3DDBB5]/25 text-[#3DDBB5] border border-[#3DDBB5]/35 shadow-sm"
                      : "bg-white/[0.04] text-white/30 border border-transparent cursor-not-allowed"
                  }`}
                  title="نطق الترجمة بالصوت العربي"
                >
                  <Volume2
                    size={14}
                    className={isAudioPlaying ? "animate-pulse" : ""}
                  />
                  <span>{isAudioPlaying ? "جاري النطق…" : "نطق صوتي"}</span>
                </button>

                {}
                <button
                  onClick={handleCopy}
                  disabled={!activeArabicSentence}
                  className={`p-2 rounded-xl text-xs transition border cursor-pointer ${
                    activeArabicSentence
                      ? "bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border-white/10"
                      : "bg-white/[0.03] text-white/20 border-transparent cursor-not-allowed"
                  }`}
                  title="نسخ النص العربي"
                  aria-label="Copy translated text"
                >
                  {copied ? (
                    <Check size={14} className="text-[#3DDBB5]" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              {}
              <button
                onClick={handleConfirmSentence}
                disabled={!activeArabicSentence}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition shadow-md cursor-pointer ${
                  activeArabicSentence
                    ? "bg-[#3DDBB5] text-[#12141A] hover:bg-[#4EEBC5]"
                    : "bg-white/[0.05] text-white/25 cursor-not-allowed"
                }`}
              >
                <span>تأكيد الإرسال</span>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {renderOriginBadge(msg.source)}
                <span className="text-[10px] font-mono text-white/40">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[90%] ${
                  msg.role === "user"
                    ? "bg-[#162624] border border-[#3DDBB5]/25 text-white"
                    : "bg-[#222631] border border-white/10 text-white"
                }`}
                dir={msg.isRTL ? "rtl" : "ltr"}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {isListeningMic && (
        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs text-sky-400 font-mono">
              Listening:{" "}
              {micTranscript ? `"${micTranscript}"` : "Speak aloud in Arabic…"}
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

      {}
      <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2 shrink-0">
        {}
        <button
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-2xl border transition cursor-pointer ${
            isListeningMic
              ? "bg-sky-400 text-[#12141A] border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
              : "bg-white/[0.06] text-white/80 hover:text-white border-white/10"
          }`}
          title={
            isListeningMic ? "إيقاف التسجيل الصوتي" : "تحدث عبر الميكروفون"
          }
          aria-label={
            isListeningMic ? "Stop recording voice" : "Speak into microphone"
          }
        >
          {isListeningMic ? <Square size={14} /> : <Mic size={14} />}
        </button>

        {}
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendText()
          }}
          placeholder="اكتب رسالة للترجمة أو الرد على الإشارات…"
          className="flex-1 bg-[#161920] border border-white/10 focus:border-[#3DDBB5]/50 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white/95 outline-none transition placeholder:text-white/30 text-right font-arabic"
          dir="rtl"
        />

        {}
        <button
          onClick={handleSendText}
          disabled={!inputVal.trim()}
          className={`p-2.5 rounded-2xl border transition cursor-pointer ${
            inputVal.trim()
              ? "bg-[#3DDBB5] text-[#12141A] border-[#3DDBB5] hover:bg-[#4EEBC5]"
              : "bg-white/[0.04] text-white/25 border-white/5 cursor-not-allowed"
          }`}
          title="Send message"
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
