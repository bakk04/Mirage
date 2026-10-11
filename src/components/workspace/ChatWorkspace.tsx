"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Send,
  Mic,
  Square,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Command,
  Info,
  Type,
  Camera,
  Hand,
  Globe,
  Bot,
} from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { speechService } from "@/services/speechService"
import { useMicrophone } from "@/hooks/useMicrophone"
import MirageAvatar from "@/components/avatar/MirageAvatar"
import AudioWaveform from "@/components/studio/AudioWaveform"
import type { GazeValues } from "@/hooks/useMousePosition"
import type { MultimodalMessage, SpokenLanguageCode } from "@/types/mirage"

interface ChatWorkspaceProps {
  onOpenGuide?: () => void
  onSwitchToCamera?: () => void
  amplitude?: number
  gaze: GazeValues
}

export default function ChatWorkspace({
  onOpenGuide,
  onSwitchToCamera,
  amplitude = 0,
  gaze,
}: ChatWorkspaceProps) {
  const messages = useMirageStore((s) => s.messages)
  const addMessage = useMirageStore((s) => s.addMessage)
  const clearMessages = useMirageStore((s) => s.clearMessages)
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setSpeakingState = useMirageStore((s) => s.setSpeakingState)
  const setVoiceListeningState = useMirageStore((s) => s.setVoiceListeningState)
  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  const [inputVal, setInputVal] = useState("")
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [micTranscript, setMicTranscript] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const {
    start: startMicAmplitude,
    stop: stopMicAmplitude,
    amplitude: micAmplitude,
  } = useMicrophone()

  const isRTL = settings.spokenLanguage === "ar"

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isListeningMic])

  // Replay message audio aloud
  const handleReplayAudio = async (msg: MultimodalMessage) => {
    if (isAudioPlaying) {
      speechService.stopSpeaking()
      setSpeakingState(false)
      return
    }

    setSpeakingState(true)

    await speechService.speak(
      msg.content,
      (msg.language as SpokenLanguageCode) || settings.spokenLanguage,
      {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        onEnd: () => setSpeakingState(false),
        onError: () => setSpeakingState(false),
      },
    )
  }

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  // Send typed message
  const handleSendText = async () => {
    const text = inputVal.trim()
    if (!text) return

    const userMsg: MultimodalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      source: "typed",
      content: text,
      timestamp: new Date(),
      language: settings.spokenLanguage,
      isRTL,
    }

    addMessage(userMsg)
    setInputVal("")
    setAvatarExpression("listening")

    // Intelligent MIRA response
    setTimeout(async () => {
      setAvatarExpression("speaking")
      const reply =
        settings.spokenLanguage === "fr"
          ? `Bien reçu : "${text}". MIRA reste à votre disposition pour la traduction des signes et l'assistance vocale.`
          : settings.spokenLanguage === "ar"
            ? `وصلتني رسالتك: "${text}". أنا جاهز للتواصل الصوتي والإشاري معك.`
            : `Received: "${text}". MIRA is ready to assist you with sign language and spoken conversation.`

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
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          onEnd: () => setSpeakingState(false),
          onError: () => setSpeakingState(false),
        })
      } else {
        setTimeout(() => setAvatarExpression("idle"), 2200)
      }
    }, 650)
  }

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (isListeningMic) {
      speechService.stopListening()
      stopMicAmplitude()
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
          setAvatarExpression("speaking")
          const reply =
            settings.spokenLanguage === "ar"
              ? "تم استلام رسالتك الصوتية بوضوح تام، وجاري معالجتها."
              : settings.spokenLanguage === "fr"
                ? "Message vocal bien reçu et transcrit avec succès."
                : "Voice message received and transcribed clearly."

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
      void startMicAmplitude()

      const started = speechService.startListening(
        settings.spokenLanguage,
        (text) => setMicTranscript(text),
        () => {
          setIsListeningMic(false)
          stopMicAmplitude()
          setVoiceListeningState(false)
        },
      )

      if (!started) {
        setIsListeningMic(false)
        stopMicAmplitude()
        setVoiceListeningState(false)
      }
    }
  }

  // Origin badge renderer
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

  const SUGGESTION_CHIPS = [
    { label: "مرحباً، كيف أبدأ لغة الإشارة؟", text: "مرحباً، كيف أبدأ استخدام لغة الإشارة العربية؟" },
    { label: "شرح نموذج MobileNetV2", text: "ما هو دور نموذج MobileNetV2 المخطط له في النظام؟" },
    { label: "التحكم بالإيماءات MediaPipe", text: "كيف يعمل نظام إيماءات التحكم اليدوية؟" },
  ]

  return (
    <div className="w-full max-w-[1200px] flex-1 flex flex-col justify-between gap-3 min-h-0 overflow-hidden">
      {/* ── TOP COMPANION HEADER BANNER ── */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-[#1A1D25] border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          {/* MIRA Mini Avatar Interactive Presence */}
          <div className="w-14 h-14 rounded-2xl bg-[#161920] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            <MirageAvatar
              expression={avatarExpression}
              amplitude={isAudioPlaying ? amplitude : isListeningMic ? micAmplitude.get() : 0}
              gaze={gaze}
              size={90}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white tracking-wide">
                MIRA AI Companion
              </span>
              <span className="w-2 h-2 rounded-full bg-[#3DDBB5] animate-pulse" />
            </div>
            <p className="text-xs text-white/60 font-mono mt-0.5">
              {isAudioPlaying
                ? "Speaking Arabic response aloud…"
                : isListeningMic
                  ? "Listening to voice input…"
                  : "Conversational Mode · Camera stream released"}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Waveform indicator */}
          <div className="hidden md:block">
            <AudioWaveform
              amplitude={isAudioPlaying ? amplitude : isListeningMic ? micAmplitude.get() : 0}
              active={isAudioPlaying || isListeningMic}
              barCount={14}
              color={isAudioPlaying ? "#3DDBB5" : "#38BDF8"}
            />
          </div>

          {/* Switch to Camera button */}
          <button
            onClick={onSwitchToCamera}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#3DDBB5]/15 hover:bg-[#3DDBB5]/25 text-[#3DDBB5] border border-[#3DDBB5]/35 transition cursor-pointer"
          >
            <Camera size={13} />
            <span className="hidden sm:inline">Open Camera Workspace</span>
            <span className="sm:hidden">Camera</span>
          </button>
        </div>
      </div>

      {/* ── CONVERSATION MESSAGES STREAM CANVAS ── */}
      <div className="flex-1 rounded-3xl bg-[#1A1D25] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-4 sm:p-5 flex flex-col justify-between overflow-hidden min-h-0">
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0">
          {messages.map((msg) => {
            const isUser = msg.role === "user"
            const isSystem = msg.source === "system"

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col ${
                  isSystem
                    ? "items-center text-center"
                    : isUser
                      ? "items-end"
                      : "items-start"
                }`}
              >
                {/* Meta details */}
                <div className="flex items-center gap-2 mb-1">
                  {renderOriginBadge(msg.source)}
                  <span className="text-[10px] font-mono text-white/40">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`relative group max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isSystem
                      ? "bg-white/[0.03] border border-white/5 text-white/60 text-xs max-w-md"
                      : isUser
                        ? "bg-[#162624] border border-[#3DDBB5]/25 text-white rounded-tr-sm shadow-sm"
                        : "bg-[#222631] border border-white/10 text-white rounded-tl-sm shadow-sm"
                  }`}
                  dir={msg.isRTL ? "rtl" : "ltr"}
                >
                  {/* ArSL Original Gloss */}
                  {msg.originalArabicGloss && (
                    <div className="text-[10px] font-mono text-[#3DDBB5]/85 mb-1 tracking-wider uppercase">
                      إشارات ArSL: {msg.originalArabicGloss}
                    </div>
                  )}

                  <p
                    className={
                      msg.isRTL
                        ? "font-arabic text-right text-base leading-relaxed"
                        : ""
                    }
                  >
                    {msg.content}
                  </p>

                  {/* Actions (Replay audio, Copy) */}
                  {!isSystem && (
                    <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-end gap-2 text-xs opacity-75 group-hover:opacity-100 transition">
                      <button
                        onClick={() => void handleReplayAudio(msg)}
                        className="p-1 rounded-lg text-white/50 hover:text-[#3DDBB5] hover:bg-white/5 transition cursor-pointer"
                        title="Replay pronunciation aloud"
                        aria-label="Replay pronunciation aloud"
                      >
                        <Volume2 size={13} />
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition cursor-pointer"
                        title="Copy text"
                        aria-label="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check size={13} className="text-[#3DDBB5]" />
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

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Activity Feedback Banner */}
        {isListeningMic && (
          <div className="my-2 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs text-sky-400 font-mono">
                Listening: {micTranscript ? `"${micTranscript}"` : "Speak aloud in Arabic…"}
              </span>
            </div>
            <AudioWaveform
              amplitude={micAmplitude.get()}
              active={true}
              barCount={14}
              color="#38BDF8"
            />
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-1.5 shrink-0">
          {SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setInputVal(chip.text)}
              className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] text-white/60 hover:text-white transition cursor-pointer font-arabic"
              dir="rtl"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── MULTIMODAL COMPOSER BAR ── */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2 shrink-0">
          {/* Microphone button */}
          <button
            onClick={toggleVoiceInput}
            className={`p-2.5 rounded-2xl border transition cursor-pointer shrink-0 ${
              isListeningMic
                ? "bg-sky-400 text-[#12141A] border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                : "bg-white/[0.06] text-white/80 hover:text-white border-white/10"
            }`}
            title={isListeningMic ? "إيقاف التسجيل الصوتي" : "تحدث عبر الميكروفون"}
            aria-label={isListeningMic ? "Stop recording voice" : "Speak via microphone"}
          >
            {isListeningMic ? <Square size={16} /> : <Mic size={16} />}
          </button>

          {/* Text Input */}
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSendText()
            }}
            placeholder="اكتب رسالة للتواصل أو الاستفسار عن لغة الإشارة…"
            className="flex-1 bg-[#161920] border border-white/10 focus:border-[#3DDBB5]/50 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white/95 outline-none transition placeholder:text-white/30 text-right font-arabic"
            dir="rtl"
          />

          {/* Send Button */}
          <button
            onClick={handleSendText}
            disabled={!inputVal.trim()}
            className={`p-2.5 rounded-2xl border transition cursor-pointer shrink-0 ${
              inputVal.trim()
                ? "bg-[#3DDBB5] text-[#12141A] border-[#3DDBB5] hover:bg-[#4EEBC5]"
                : "bg-white/[0.04] text-white/25 border-white/5 cursor-not-allowed"
            }`}
            title="Send message"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
