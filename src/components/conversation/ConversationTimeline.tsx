"use client"

// Scroll to bottom on new messages

// Replay audio for a message

// Copy message text

// Submit typed text

// MIRAGE conversational response

// Toggle voice input

// Render origin badge
/* Title Bar */ /* Messages Scroll Area */ /* Meta details header */ /* Message Bubble Card */ /* Original gloss if from sign language */ /* Message Action Controls */ /* Voice Activity Feedback Banner */ /* Archive Composer Bar */

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Volume2,
  Mic,
  Send,
  Sparkles,
  Command,
  Info,
  Type,
  Copy,
  Check,
  Square,
  History,
  Trash2,
} from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { speechService } from "@/services/speechService"
import { useMicrophone } from "@/hooks/useMicrophone"
import type { MultimodalMessage } from "@/types/mirage"

export default function ConversationTimeline() {
  const messages = useMirageStore((s) => s.messages)
  const addMessage = useMirageStore((s) => s.addMessage)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const settings = useMirageStore((s) => s.settings)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setIsAudioPlaying = useMirageStore((s) => s.setIsAudioPlaying)

  const [inputVal, setInputVal] = useState("")
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [micTranscript, setMicTranscript] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const { start: startMicAmplitude, stop: stopMicAmplitude } = useMicrophone()
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  const handleReplayAudio = (msg: MultimodalMessage) => {
    if (isAudioPlaying) {
      speechService.stopSpeaking()
      setIsAudioPlaying(false)
      setAvatarExpression("idle")
      return
    }

    setIsAudioPlaying(true)
    setAvatarExpression("speaking")

    void speechService.speak(msg.content, settings.spokenLanguage, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      onEnd: () => {
        setIsAudioPlaying(false)
        setAvatarExpression("idle")
      },
      onError: () => {
        setIsAudioPlaying(false)
        setAvatarExpression("idle")
      },
    })
  }
  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }
  const handleSendText = () => {
    const text = inputVal.trim()
    if (!text) return

    const userMsg: MultimodalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      source: "typed",
      content: text,
      timestamp: new Date(),
      language: settings.spokenLanguage,
      isRTL:
        settings.spokenLanguage ===
        "ar",
    }

    addMessage(userMsg)
    setInputVal("")
    setAvatarExpression("listening")
    setTimeout(() => {
      setAvatarExpression("speaking")
      const reply =
        settings.spokenLanguage ===
        "fr"
          ? `J'ai bien reçu votre message : "${text}". Comment puis-je vous assister avec la traduction gestuelle ?`
          : settings.spokenLanguage ===
              "ar"
            ? `وصلتني رسالتك: "${text}". كيف يمكنني مساعدتك في الترجمة والتواصل الإشاري؟`
            : `I received your message: "${text}". How can I assist you with sign translation and gesture interaction?`

      const mirageReply: MultimodalMessage = {
        id: crypto.randomUUID(),
        role: "mirage",
        source: "avatar",
        content: reply,
        confidence: 0.99,
        timestamp: new Date(),
        language: settings.spokenLanguage,
        isRTL:
          settings.spokenLanguage ===
          "ar",
      }

      addMessage(mirageReply)

      if (settings.autoSpeak) {
        void speechService.speak(reply, settings.spokenLanguage)
      }
      setTimeout(() => setAvatarExpression("idle"), 2500)
    }, 800)
  }
  const toggleVoiceInput = () => {
    if (isListeningMic) {
      speechService.stopListening()
      stopMicAmplitude()
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
          isRTL:
            settings.spokenLanguage ===
            "ar",
        }
        addMessage(voiceMsg)
        setMicTranscript("")

        setTimeout(() => {
          setAvatarExpression("speaking")
          const reply =
            settings.spokenLanguage ===
            "fr"
              ? "Transcription vocale reçue. Je peux afficher les signes correspondants ou répondre."
              : settings.spokenLanguage ===
                  "ar"
                ? "تم تحويل كلامك الصوتي إلى نص بنجاح. أستطيع ترجمته إلى إشارات أو إجابتك."
                : "Voice transcription received. I can present the signs or translate for your partner."

          const mirageReply: MultimodalMessage = {
            id: crypto.randomUUID(),
            role: "mirage",
            source: "avatar",
            content: reply,
            confidence: 0.99,
            timestamp: new Date(),
            language: settings.spokenLanguage,
            isRTL:
              settings.spokenLanguage ===
              "ar",
          }
          addMessage(mirageReply)
          if (settings.autoSpeak) {
            void speechService.speak(reply, settings.spokenLanguage)
          }
          setTimeout(() => setAvatarExpression("idle"), 2400)
        }, 800)
      }
    } else {
      setMicTranscript("")
      setIsListeningMic(true)
      setAvatarExpression("listening")
      void startMicAmplitude()

      const started = speechService.startListening(
        settings.spokenLanguage,
        (text) => {
          setMicTranscript(text)
        },
        () => {
          setIsListeningMic(false)
          stopMicAmplitude()
          setAvatarExpression("idle")
        },
      )

      if (!started) {
        setIsListeningMic(false)
        stopMicAmplitude()
      }
    }
  }
  const renderOriginBadge = (source: MultimodalMessage["source"]) => {
    switch (source) {
      case "arabic_sign":
      case "sign":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#45B9F5] bg-[#45B9F5]/14 border border-[#45B9F5]/30 px-2 py-0.5 rounded-md">
            <span>🤟</span> ArSL Arabic Sign
          </span>
        )
      case "speech":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#43D9BD] bg-[#43D9BD]/14 border border-[#43D9BD]/30 px-2 py-0.5 rounded-md">
            <Mic size={11} /> Spoken Voice
          </span>
        )
      case "typed":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#A1ACBC] bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md">
            <Type size={11} /> Typed
          </span>
        )
      case "avatar":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#43D9BD] bg-[#43D9BD]/12 border border-[#43D9BD]/30 px-2 py-0.5 rounded-md">
            <Sparkles size={11} /> MIRA Companion
          </span>
        )
      case "command":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#F2AE75] bg-[#F2AE75]/14 border border-[#F2AE75]/30 px-2 py-0.5 rounded-md">
            <Command size={11} /> Gesture Command
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#737F91] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
            <Info size={11} /> System
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#191F2B]/75 backdrop-blur-2xl border border-white/[0.10] p-4 sm:p-5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] apple-specular-edge min-h-0 overflow-hidden select-none">
      {}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <History size={15} className="text-[#43D9BD]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#F4F7FB] font-semibold">
            Multimodal Session Archive
          </span>
        </div>
        <span className="text-xs font-mono text-[#A1ACBC]">
          {messages.length} Events Logged
        </span>
      </div>

      {}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1.5 min-h-0 overscroll-contain">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMirage = msg.role === "mirage"
            const isSystem = msg.source === "system"

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${
                  isSystem
                    ? "items-center text-center"
                    : isMirage
                      ? "items-start"
                      : "items-end"
                }`}
              >
                {}
                <div className="flex items-center gap-2 mb-1">
                  {renderOriginBadge(msg.source)}
                  <span className="text-[10px] text-[#737F91] font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {}
                <div
                  className={`relative group max-w-[88%] rounded-xl p-3 text-xs sm:text-sm leading-relaxed ${
                    isSystem
                      ? "bg-white/[0.03] border border-white/[0.06] text-[#A1ACBC] text-xs max-w-md shadow-xs"
                      : isMirage
                        ? "bg-[#10141C]/85 border border-white/[0.08] text-[#F4F7FB] rounded-tl-xs shadow-xs"
                        : "bg-[#43D9BD]/12 border border-[#43D9BD]/30 text-[#F4F7FB] rounded-tr-xs shadow-xs"
                  }`}
                  dir={msg.isRTL ? "rtl" : "ltr"}
                >
                  {}
                  {msg.originalArabicGloss && (
                    <div className="text-[10px] font-mono text-[#45B9F5] mb-1 tracking-wider uppercase">
                      إشارات ArSL: {msg.originalArabicGloss}
                    </div>
                  )}

                  <p
                    className={
                      msg.isRTL
                        ? "font-arabic text-right text-sm sm:text-base leading-relaxed"
                        : ""
                    }
                  >
                    {msg.content}
                  </p>

                  {}
                  {!isSystem && (
                    <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-end gap-1.5 text-xs opacity-70 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleReplayAudio(msg)}
                        className="p-1 rounded-md text-[#A1ACBC] hover:text-[#43D9BD] hover:bg-white/[0.06] transition cursor-pointer"
                        title="Play audio aloud"
                        aria-label="Play audio aloud"
                      >
                        <Volume2 size={12} />
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded-md text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.06] transition cursor-pointer"
                        title="Copy message text"
                        aria-label="Copy message text"
                      >
                        {copiedId === msg.id ? (
                          <Check size={12} className="text-[#43D9BD]" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {}
      {isListeningMic && (
        <div className="mb-2 p-2 rounded-xl bg-[#43D9BD]/12 border border-[#43D9BD]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#43D9BD] animate-pulse" />
            <span className="text-xs text-[#43D9BD] font-mono">
              Listening… {micTranscript && `"${micTranscript}"`}
            </span>
          </div>
          <button
            onClick={toggleVoiceInput}
            className="px-2.5 py-0.5 rounded-lg bg-[#43D9BD]/20 text-[#43D9BD] text-xs font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      {}
      <div className="pt-2.5 border-t border-white/[0.08] flex items-center gap-2 shrink-0">
        <button
          onClick={toggleVoiceInput}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            isListeningMic
              ? "bg-[#43D9BD] text-[#0B0D12] border-[#43D9BD]"
              : "bg-white/[0.05] text-[#A1ACBC] hover:text-[#F4F7FB] border-white/[0.10]"
          }`}
          title={
            isListeningMic ? "Stop recording voice" : "Speak via microphone"
          }
          aria-label={
            isListeningMic ? "Stop recording voice" : "Speak via microphone"
          }
        >
          {isListeningMic ? <Square size={15} /> : <Mic size={15} />}
        </button>

        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendText()
          }}
          placeholder="Type message to archive or respond…"
          className="flex-1 bg-[#0B0D12]/70 border border-white/[0.10] focus:border-[#43D9BD]/60 focus:ring-1 focus:ring-[#43D9BD]/40 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#F4F7FB] outline-none transition placeholder:text-[#737F91]"
        />

        <button
          onClick={handleSendText}
          disabled={!inputVal.trim()}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            inputVal.trim()
              ? "bg-[#43D9BD] text-[#0B0D12] border-[#43D9BD] hover:bg-[#34C7A8]"
              : "bg-white/[0.03] text-white/20 border-white/[0.06] cursor-not-allowed"
          }`}
          title="Send message"
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
