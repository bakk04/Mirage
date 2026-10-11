"use client"

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
  RotateCcw,
  Square,
  AlertCircle,
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
  const { start: startMicAmplitude, stop: stopMicAmplitude, amplitude } = useMicrophone()

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Replay audio for a message
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

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  // Submit typed text
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
      isRTL: settings.spokenLanguage === "ar",
    }

    addMessage(userMsg)
    setInputVal("")
    setAvatarExpression("listening")

    // MIRAGE conversational response
    setTimeout(() => {
      setAvatarExpression("speaking")
      const reply =
        settings.spokenLanguage === "fr"
          ? `J'ai bien reçu votre message : "${text}". Comment puis-je vous assister avec la traduction gestuelle ?`
          : settings.spokenLanguage === "ar"
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
        isRTL: settings.spokenLanguage === "ar",
      }

      addMessage(mirageReply)

      if (settings.autoSpeak) {
        void speechService.speak(reply, settings.spokenLanguage)
      }
      setTimeout(() => setAvatarExpression("idle"), 2500)
    }, 1000)
  }

  // Toggle voice input (Speech to Text)
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
          isRTL: settings.spokenLanguage === "ar",
        }
        addMessage(voiceMsg)
        setMicTranscript("")

        // Avatar reply to speech
        setTimeout(() => {
          setAvatarExpression("speaking")
          const reply =
            settings.spokenLanguage === "fr"
              ? "Transcription vocale reçue. Je peux afficher les signes correspondants ou répondre."
              : settings.spokenLanguage === "ar"
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
            isRTL: settings.spokenLanguage === "ar",
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
      void startMicAmplitude()

      const started = speechService.startListening(
        settings.spokenLanguage,
        (text, isFinal) => {
          setMicTranscript(text)
        },
        (err) => {
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

  // Render origin pill
  const renderOriginBadge = (source: MultimodalMessage["source"]) => {
    switch (source) {
      case "sign":
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-[#5EEAD4] bg-[#5EEAD4]/10 border border-[#5EEAD4]/25 px-2 py-0.5 rounded-full">
            <span>🤟</span> Sign Translation
          </span>
        )
      case "speech":
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-0.5 rounded-full">
            <Mic size={10} /> Spoken Voice
          </span>
        )
      case "typed":
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-white/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            <Type size={10} /> Typed Message
          </span>
        )
      case "avatar":
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/25 px-2 py-0.5 rounded-full">
            <Sparkles size={10} /> MIRAGE Companion
          </span>
        )
      case "command":
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-[#FB923C] bg-[#FB923C]/10 border border-[#FB923C]/25 px-2 py-0.5 rounded-full">
            <Command size={10} /> Gesture Command
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-white/40 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
            <Info size={10} /> System
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col h-full rounded-3xl bg-[#0D1117] border border-white/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <span className="text-xs font-mono uppercase tracking-wider text-white/50">
          Multimodal Conversation Stream
        </span>
        <span className="text-[11px] font-mono text-white/40">
          {messages.length} events
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMirage = msg.role === "mirage"
            const isSystem = msg.source === "system"

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col ${
                  isSystem
                    ? "items-center text-center"
                    : isMirage
                      ? "items-start"
                      : "items-end"
                }`}
              >
                {/* Meta details header */}
                <div className="flex items-center gap-2 mb-1">
                  {renderOriginBadge(msg.source)}
                  <span className="text-[10px] text-white/35 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`relative group max-w-[88%] rounded-2xl p-3.5 text-sm font-light leading-relaxed ${
                    isSystem
                      ? "bg-white/[0.03] border border-white/5 text-white/50 text-xs max-w-md"
                      : isMirage
                        ? "bg-[#131923] border border-white/10 text-white/95 rounded-tl-sm"
                        : "bg-[#0F1E24] border border-[#5EEAD4]/20 text-white/95 rounded-tr-sm"
                  }`}
                  dir={msg.isRTL ? "rtl" : "ltr"}
                >
                  {/* Original gloss if from sign language */}
                  {msg.originalGloss && (
                    <div className="text-[10px] font-mono text-[#5EEAD4]/75 mb-1 tracking-wider uppercase">
                      GLOSS: {msg.originalGloss}
                    </div>
                  )}

                  <p className={msg.isRTL ? "font-sans text-right" : ""}>
                    {msg.content}
                  </p>

                  {/* Message Action Controls (Hover or mobile touch) */}
                  {!isSystem && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-end gap-2 text-xs opacity-75 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleReplayAudio(msg)}
                        className="p-1 rounded-lg text-white/50 hover:text-[#5EEAD4] hover:bg-white/5 transition"
                        title="Play audio aloud"
                      >
                        <Volume2 size={13} />
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5 transition"
                        title="Copy message text"
                      >
                        {copiedId === msg.id ? (
                          <Check size={13} className="text-[#5EEAD4]" />
                        ) : (
                          <Copy size={13} />
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

      {/* Voice Activity Feedback Banner (when recording) */}
      {isListeningMic && (
        <div className="mb-2 p-3 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="text-xs text-[#22D3EE] font-mono">
              Listening to voice… {micTranscript && `"${micTranscript}"`}
            </span>
          </div>
          <button
            onClick={toggleVoiceInput}
            className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] text-[11px] font-medium"
          >
            Done
          </button>
        </div>
      )}

      {/* Text Message Composer & Microphone Input */}
      <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2">
        {/* Mic Toggle Button */}
        <button
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-2xl border transition backdrop-blur-md ${
            isListeningMic
              ? "bg-[#22D3EE] text-black border-[#22D3EE] shadow-[0_0_16px_rgba(34,211,238,0.4)]"
              : "bg-white/5 text-white/70 hover:text-white border-white/10"
          }`}
          title={isListeningMic ? "Stop recording voice" : "Speak via microphone"}
        >
          {isListeningMic ? <Square size={16} /> : <Mic size={16} />}
        </button>

        {/* Text Input */}
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendText()
          }}
          placeholder="Type message or reply to signs…"
          className="flex-1 bg-black/40 border border-white/10 focus:border-[#5EEAD4]/50 rounded-2xl px-4 py-2.5 text-xs text-white/90 outline-none transition placeholder:text-white/25"
        />

        {/* Send Button */}
        <button
          onClick={handleSendText}
          disabled={!inputVal.trim()}
          className={`p-2.5 rounded-2xl border transition ${
            inputVal.trim()
              ? "bg-[#5EEAD4] text-black border-[#5EEAD4] hover:bg-[#3DDBB5]"
              : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed"
          }`}
          title="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
