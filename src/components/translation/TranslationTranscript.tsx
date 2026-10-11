"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  Send,
  Sparkles,
  ArrowRight,
  Globe,
  RotateCcw,
} from "lucide-react"
import {
  useMirageStore,
  SIGN_LANGUAGES,
  SPOKEN_LANGUAGES,
} from "@/store/mirageStore"
import { synthesizeSentence } from "@/services/gestureEngine"
import { speechService } from "@/services/speechService"
import type { MultimodalMessage, SignLanguageCode, SpokenLanguageCode } from "@/types/mirage"

export default function TranslationTranscript() {
  const currentSignTokens = useMirageStore((s) => s.currentSignTokens)
  const removeSignToken = useMirageStore((s) => s.removeSignToken)
  const clearSignDraft = useMirageStore((s) => s.clearSignDraft)
  const addMessage = useMirageStore((s) => s.addMessage)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setIsAudioPlaying = useMirageStore((s) => s.setIsAudioPlaying)

  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  const [copied, setCopied] = useState(false)

  // Current translated sentence
  const translatedText = useMemo(() => {
    return synthesizeSentence(currentSignTokens, settings.spokenLanguage)
  }, [currentSignTokens, settings.spokenLanguage])

  const isRTL = settings.spokenLanguage === "ar"

  // Speak translation aloud
  const handleSpeak = async () => {
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

  // Confirm sentence and save to Conversation History
  const handleConfirmAndSend = () => {
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

    // If auto-speak enabled, speak the confirmed translation
    if (settings.autoSpeak) {
      void speechService.speak(translatedText, settings.spokenLanguage)
    }

    // MIRAGE avatar companion reply after a brief thoughtful pause
    setTimeout(() => {
      setAvatarExpression("speaking")
      const replyText =
        settings.spokenLanguage === "fr"
          ? "Bien reçu ! Votre message a été interprété et prononcé avec succès."
          : settings.spokenLanguage === "ar"
            ? "تم استلام إشارتك بنجاح ونطقها بوضوح تام."
            : "Understood! Your sign message was translated and spoken clearly."

      const mirageReply: MultimodalMessage = {
        id: crypto.randomUUID(),
        role: "mirage",
        source: "avatar",
        content: replyText,
        confidence: 0.99,
        timestamp: new Date(),
        language: settings.spokenLanguage,
        isRTL,
      }
      addMessage(mirageReply)

      if (settings.autoSpeak) {
        void speechService.speak(replyText, settings.spokenLanguage)
      }
      setTimeout(() => setAvatarExpression("idle"), 2400)
    }, 1200)
  }

  // Copy to clipboard
  const handleCopy = () => {
    if (!translatedText) return
    void navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col h-full rounded-3xl bg-[#0D1117] border border-white/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
      {/* Header: Language Pipeline Selector */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-[#5EEAD4]" />
          <span className="text-xs uppercase tracking-wider font-mono text-white/50">
            Pipeline:
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Source Sign Language */}
          <select
            value={settings.signLanguage}
            onChange={(e) =>
              updateSettings({
                signLanguage: e.target.value as SignLanguageCode,
              })
            }
            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-white/90 text-xs outline-none focus:border-[#5EEAD4]/50"
          >
            {SIGN_LANGUAGES.map((sl) => (
              <option key={sl.code} value={sl.code} className="bg-[#11151A]">
                {sl.nativeName} ({sl.name})
              </option>
            ))}
          </select>

          <ArrowRight size={13} className="text-white/30" />

          {/* Target Spoken / Written Language */}
          <select
            value={settings.spokenLanguage}
            onChange={(e) =>
              updateSettings({
                spokenLanguage: e.target.value as SpokenLanguageCode,
              })
            }
            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-white/90 text-xs outline-none focus:border-[#5EEAD4]/50"
          >
            {SPOKEN_LANGUAGES.map((sp) => (
              <option key={sp.code} value={sp.code} className="bg-[#11151A]">
                {sp.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Streaming Recognized Sign Sequence (Token chips) */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider text-white/40 uppercase">
            Recognized Sign Sequence:
          </span>
          {currentSignTokens.length > 0 && (
            <button
              onClick={clearSignDraft}
              className="text-[11px] text-white/40 hover:text-white/80 flex items-center gap-1 transition"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 rounded-2xl bg-black/40 border border-white/5">
          {currentSignTokens.length === 0 ? (
            <span className="text-xs text-white/30 font-light italic px-1">
              Signs will appear here as you perform them in front of the camera...
            </span>
          ) : (
            currentSignTokens.map((tok) => (
              <motion.div
                key={tok.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 text-xs text-[#5EEAD4]"
              >
                <span className="font-medium font-mono">{tok.gloss}</span>
                <span className="text-[10px] text-white/50">
                  {Math.round(tok.confidence * 100)}%
                </span>
                <button
                  onClick={() => removeSignToken(tok.id)}
                  className="hover:text-white/90 text-white/40 ml-0.5"
                  title="Remove token"
                >
                  ×
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Synthesized Natural Language Output Area */}
      <div className="mt-5 flex-1 flex flex-col justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono tracking-wider text-[#5EEAD4]/70 uppercase flex items-center gap-1.5">
              <Sparkles size={12} />
              Natural Translation Output:
            </span>
            {translatedText && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4]">
                CONFIDENT
              </span>
            )}
          </div>

          <div
            className={`min-h-[72px] text-base sm:text-lg font-light leading-relaxed ${
              translatedText ? "text-white/95" : "text-white/30 italic"
            } ${isRTL ? "text-right font-sans" : "text-left"}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {translatedText || "Awaiting signs to construct sentence…"}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              disabled={!translatedText || isAudioPlaying}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition backdrop-blur-md ${
                translatedText
                  ? "bg-[#5EEAD4]/15 hover:bg-[#5EEAD4]/25 text-[#5EEAD4] border border-[#5EEAD4]/30"
                  : "bg-white/5 text-white/30 border border-transparent cursor-not-allowed"
              }`}
              title="Speak translated text aloud"
            >
              <Volume2
                size={14}
                className={isAudioPlaying ? "animate-pulse" : ""}
              />
              <span>{isAudioPlaying ? "Speaking…" : "Speak Translation"}</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!translatedText}
              className={`p-2 rounded-xl text-xs transition border ${
                translatedText
                  ? "bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
                  : "bg-white/5 text-white/20 border-transparent cursor-not-allowed"
              }`}
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} className="text-[#5EEAD4]" /> : <Copy size={14} />}
            </button>

            <button
              onClick={clearSignDraft}
              disabled={!translatedText && currentSignTokens.length === 0}
              className="p-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 border border-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Clear draft"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <button
            onClick={handleConfirmAndSend}
            disabled={!translatedText}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition shadow-lg ${
              translatedText
                ? "bg-[#5EEAD4] text-black hover:bg-[#3DDBB5]"
                : "bg-white/5 text-white/25 cursor-not-allowed"
            }`}
          >
            <span>Confirm & Send</span>
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
