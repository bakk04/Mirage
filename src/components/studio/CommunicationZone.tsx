"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Globe,
  ArrowRight,
  Volume2,
  VolumeX,
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
  ChevronDown,
  Layers,
} from "lucide-react"
import {
  useMirageStore,
  SIGN_LANGUAGES,
  SPOKEN_LANGUAGES,
} from "@/store/mirageStore"
import { synthesizeSentence } from "@/services/gestureEngine"
import { speechService } from "@/services/speechService"
import { useMicrophone } from "@/hooks/useMicrophone"
import AudioWaveform from "./AudioWaveform"
import type { MultimodalMessage, SignLanguageCode, SpokenLanguageCode } from "@/types/mirage"

export default function CommunicationZone() {
  const currentSignTokens = useMirageStore((s) => s.currentSignTokens)
  const removeSignToken = useMirageStore((s) => s.removeSignToken)
  const clearSignDraft = useMirageStore((s) => s.clearSignDraft)
  const addMessage = useMirageStore((s) => s.addMessage)
  const messages = useMirageStore((s) => s.messages)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setIsAudioPlaying = useMirageStore((s) => s.setIsAudioPlaying)

  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  const [inputVal, setInputVal] = useState("")
  const [copied, setCopied] = useState(false)
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [micTranscript, setMicTranscript] = useState("")
  const [activeTab, setActiveTab] = useState<"translate" | "history">("translate")

  const { start: startMicAmp, stop: stopMicAmp, amplitude: micAmplitude } = useMicrophone()

  // Synthesize translated sentence
  const translatedText = useMemo(() => {
    return synthesizeSentence(currentSignTokens, settings.spokenLanguage)
  }, [currentSignTokens, settings.spokenLanguage])

  const isRTL = settings.spokenLanguage === "ar"

  // Speak translation aloud
  const handleSpeakTranslation = async () => {
    if (!translatedText || isAudioPlaying) return

    setIsAudioPlaying(true)
    setAvatarExpression("speaking")

    await speechService.speak(translatedText, settings.spokenLanguage, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      onEnd: () => {
        setIsAudioPlaying(false)
        setAvatarExpression("understanding")
        setTimeout(() => setAvatarExpression("idle"), 1400)
      },
      onError: () => {
        setIsAudioPlaying(false)
        setAvatarExpression("idle")
      },
    })
  }

  // Confirm sentence & add to timeline
  const handleConfirmSentence = () => {
    if (!translatedText) return

    const newMessage: MultimodalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      source: "sign",
      content: translatedText,
      originalGloss: currentSignTokens.map((t) => t.gloss).join(" "),
      signTokens: [...currentSignTokens],
      confidence: 0.95,
      timestamp: new Date(),
      language: settings.spokenLanguage,
      isRTL,
    }

    addMessage(newMessage)
    clearSignDraft()
    setAvatarExpression("success")

    if (settings.autoSpeak) {
      void speechService.speak(translatedText, settings.spokenLanguage)
    }

    // Contextual avatar response
    setTimeout(() => {
      setAvatarExpression("speaking")
      const replyText =
        settings.spokenLanguage === "fr"
          ? "Message en langue des signes interprété et validé avec succès."
          : settings.spokenLanguage === "ar"
            ? "تمت ترجمة الإشارة ونطقها بنجاح واكتمال."
            : "Understood! Your sign message was translated and spoken clearly."

      const replyMsg: MultimodalMessage = {
        id: crypto.randomUUID(),
        role: "mirage",
        source: "avatar",
        content: replyText,
        confidence: 0.99,
        timestamp: new Date(),
        language: settings.spokenLanguage,
        isRTL,
      }
      addMessage(replyMsg)
      if (settings.autoSpeak) {
        void speechService.speak(replyText, settings.spokenLanguage)
      }
      setTimeout(() => setAvatarExpression("idle"), 2400)
    }, 1200)
  }

  // Copy translated text
  const handleCopy = () => {
    if (!translatedText) return
    void navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (isListeningMic) {
      speechService.stopListening()
      stopMicAmp()
      setIsListeningMic(false)
      setAvatarExpression("idle")

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

        setTimeout(() => {
          setAvatarExpression("speaking")
          const reply =
            settings.spokenLanguage === "fr"
              ? "Parole entendue. Je peux afficher les signes correspondants."
              : settings.spokenLanguage === "ar"
                ? "تم استلام رسالتك الصوتية وجارٍ التنسيق."
                : "Voice received. Translating for your sign conversation partner."

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
            void speechService.speak(reply, settings.spokenLanguage)
          }
          setTimeout(() => setAvatarExpression("idle"), 2400)
        }, 900)
      }
    } else {
      setMicTranscript("")
      setIsListeningMic(true)
      setAvatarExpression("listening")
      void startMicAmp()

      const started = speechService.startListening(
        settings.spokenLanguage,
        (text) => setMicTranscript(text),
        () => {
          setIsListeningMic(false)
          stopMicAmp()
          setAvatarExpression("idle")
        },
      )

      if (!started) {
        setIsListeningMic(false)
        stopMicAmp()
      }
    }
  }

  // Send typed text
  const handleSendText = () => {
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
    setAvatarExpression("listening")

    setTimeout(() => {
      setAvatarExpression("speaking")
      const reply =
        settings.spokenLanguage === "fr"
          ? `Bien reçu : "${text}".`
          : settings.spokenLanguage === "ar"
            ? `وصلتني رسالتك: "${text}".`
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
        void speechService.speak(reply, settings.spokenLanguage)
      }
      setTimeout(() => setAvatarExpression("idle"), 2200)
    }, 1000)
  }

  // Render origin badge
  const renderOriginBadge = (source: MultimodalMessage["source"]) => {
    switch (source) {
      case "sign":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#5EEAD4] bg-[#5EEAD4]/10 border border-[#5EEAD4]/25 px-2 py-0.5 rounded-full">
            <span>🤟</span> Sign Translation
          </span>
        )
      case "speech":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-0.5 rounded-full">
            <Mic size={10} /> Spoken Voice
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
            <Sparkles size={10} /> MIRAGE
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
      {/* Header: Language Pipeline Bar & View Switcher */}
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

        {/* View Switcher: Translate vs History */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/5">
          <button
            onClick={() => setActiveTab("translate")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
              activeTab === "translate"
                ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Live Draft
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
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
          {/* Sign Token Sequence Stream */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                MobileNetV2 Sign Sequence:
              </span>
              {currentSignTokens.length > 0 && (
                <button
                  onClick={clearSignDraft}
                  className="text-[10px] font-mono text-white/40 hover:text-white/80 flex items-center gap-1 transition"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] p-2 rounded-2xl bg-black/40 border border-white/5">
              {currentSignTokens.length === 0 ? (
                <span className="text-xs text-white/30 font-light italic px-1">
                  Signs will accumulate here as recognized by MobileNetV2…
                </span>
              ) : (
                currentSignTokens.map((tok) => (
                  <motion.div
                    key={tok.id}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 text-xs text-[#5EEAD4]"
                  >
                    <span className="font-mono font-medium">{tok.gloss}</span>
                    <span className="text-[9px] text-white/50">
                      {Math.round(tok.confidence * 100)}%
                    </span>
                    <button
                      onClick={() => removeSignToken(tok.id)}
                      className="text-white/40 hover:text-white ml-0.5"
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Natural Language Output Area */}
          <div className="flex-1 flex flex-col justify-between p-3.5 rounded-2xl bg-black/30 border border-white/5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5EEAD4]/80 flex items-center gap-1">
                  <Sparkles size={11} /> Natural Translation:
                </span>
                {translatedText && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4]">
                    CONFIRMED
                  </span>
                )}
              </div>

              <div
                className={`min-h-[50px] text-base font-light leading-relaxed ${
                  translatedText ? "text-white/95" : "text-white/30 italic"
                } ${isRTL ? "text-right font-sans" : "text-left"}`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                {translatedText || "Perform signs in camera to compose sentence…"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSpeakTranslation}
                  disabled={!translatedText || isAudioPlaying}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    translatedText
                      ? "bg-[#5EEAD4]/15 hover:bg-[#5EEAD4]/25 text-[#5EEAD4] border border-[#5EEAD4]/30"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <Volume2 size={13} className={isAudioPlaying ? "animate-pulse" : ""} />
                  <span>{isAudioPlaying ? "Speaking…" : "Speak"}</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!translatedText}
                  className={`p-1.5 rounded-xl text-xs transition border ${
                    translatedText
                      ? "bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
                      : "bg-white/5 text-white/20 border-transparent cursor-not-allowed"
                  }`}
                  title="Copy text"
                >
                  {copied ? <Check size={13} className="text-[#5EEAD4]" /> : <Copy size={13} />}
                </button>
              </div>

              <button
                onClick={handleConfirmSentence}
                disabled={!translatedText}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-medium transition shadow-md ${
                  translatedText
                    ? "bg-[#5EEAD4] text-black hover:bg-[#3DDBB5]"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                }`}
              >
                <span>Confirm</span>
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

      {/* Live Voice Activity Banner (When Recording) */}
      {isListeningMic && (
        <div className="p-2.5 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="text-xs text-[#22D3EE] font-mono">
              Listening: {micTranscript ? `"${micTranscript}"` : "Speak aloud…"}
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
          className={`p-2.5 rounded-2xl border transition ${
            isListeningMic
              ? "bg-[#22D3EE] text-black border-[#22D3EE] shadow-[0_0_12px_rgba(34,211,238,0.4)]"
              : "bg-white/5 text-white/70 hover:text-white border-white/10"
          }`}
          title={isListeningMic ? "Stop voice recording" : "Speak via microphone"}
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
          placeholder="Type message or reply to signs…"
          className="flex-1 bg-black/40 border border-white/10 focus:border-[#5EEAD4]/50 rounded-2xl px-3.5 py-2 text-xs text-white/90 outline-none transition placeholder:text-white/25"
        />

        {/* Send Button */}
        <button
          onClick={handleSendText}
          disabled={!inputVal.trim()}
          className={`p-2 rounded-2xl border transition ${
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
