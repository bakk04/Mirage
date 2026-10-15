"use client" /* ── PRIMARY COLUMN: FULL CHAT WORKSPACE CANVAS ── */ /* Top Header Bar */ /* Conversation Messages Canvas Card */ /* Scrollable Messages Area */ /* Live Voice Recording Banner */ /* Suggestion Chips */ /* Non-shrinking Composer */ /* ── SECONDARY COLUMN: MIRA AI COMPANION STAGE ── */
import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Send,
  Mic,
  Square,
  Volume2,
  Copy,
  Check,
  Camera,
  Hand,
  Sparkles,
  Command,
  Info,
  Type,
} from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"
import { speechService } from "@/services/speechService"
import { useMicrophone } from "@/hooks/useMicrophone"
import MirageAvatar from "@/components/avatar/MirageAvatar"
import AvatarExpressionController from "@/components/avatar/AvatarExpressionController"
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
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const setSpeakingState = useMirageStore((s) => s.setSpeakingState)
  const setVoiceListeningState = useMirageStore((s) => s.setVoiceListeningState)
  const settings = useMirageStore((s) => s.settings)

  const [inputVal, setInputVal] = useState("")
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [micTranscript, setMicTranscript] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const userScrolledUpRef = useRef(false)

  const {
    start: startMicAmplitude,
    stop: stopMicAmplitude,
    amplitude: micAmplitude,
  } = useMicrophone()

  const isRTL = settings.spokenLanguage === "ar"

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 120
  }, [])

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isListeningMic])

  const handleReplayAudio = async (msg: MultimodalMessage) => {
    if (isAudioPlaying) {
      speechService.stopSpeaking()
      setSpeakingState(false)
      return
    }

    setSpeakingState(true)

    await speechService.speak(
      msg.content,
      msg.language as SpokenLanguageCode || settings.spokenLanguage,
      {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        onEnd: () => setSpeakingState(false),
        onError: () => setSpeakingState(false),
      },
    )
  }

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

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
    userScrolledUpRef.current = false
    setAvatarExpression("listening")

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
        userScrolledUpRef.current = false

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

  const renderOriginBadge = (source: MultimodalMessage["source"]) => {
    switch (source) {
      case "arabic_sign":
      case "sign":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#45B9F5] bg-[#45B9F5]/14 border border-[#45B9F5]/30 px-2 py-0.5 rounded-md">
            <span>🤟</span> ArSL Sign
          </span>
        )
      case "speech":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#43D9BD] bg-[#43D9BD]/14 border border-[#43D9BD]/30 px-2 py-0.5 rounded-md">
            <Mic size={11} /> Voice
          </span>
        )
      case "typed":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#A1ACBC] bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md">
            <Type size={11} /> Text
          </span>
        )
      case "avatar":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#43D9BD] bg-[#43D9BD]/12 border border-[#43D9BD]/30 px-2 py-0.5 rounded-md">
            <Sparkles size={11} /> MIRA
          </span>
        )
      case "command":
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#F2AE75] bg-[#F2AE75]/14 border border-[#F2AE75]/30 px-2 py-0.5 rounded-md">
            <Command size={11} /> Gesture
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#737F91] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
            <Info size={11} /> System
          </span>
        )
    }
  }

  const SUGGESTION_CHIPS = [
    {
      label: "مرحباً، كيف أبدأ لغة الإشارة؟",
      text: "مرحباً، كيف أبدأ استخدام لغة الإشارة العربية؟",
    },
    {
      label: "شرح نموذج MobileNetV2",
      text: "ما هو دور نموذج MobileNetV2 المخطط له في النظام؟",
    },
    {
      label: "التحكم بالإيماءات MediaPipe",
      text: "كيف يعمل نظام إيماءات التحكم اليدوية؟",
    },
  ]

  return (
    <div className="w-full max-w-[1400px] flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-4 lg:gap-5 items-start select-none pb-4">
      {}
      <div className="flex flex-col gap-3 min-w-0 min-h-0 h-[calc(100dvh-10rem)]">
        {}
        <div className="px-3.5 py-2 rounded-2xl bg-[#191F2B]/75 backdrop-blur-xl border border-white/[0.10] shadow-sm apple-specular-edge flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#43D9BD] shadow-[0_0_6px_rgba(67,217,189,0.8)] animate-pulse" />
            <span className="text-xs font-semibold text-[#F4F7FB] tracking-wide">
              Text & Voice Conversational Workspace
            </span>
          </div>

          <button
            onClick={onSwitchToCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-[#A1ACBC] hover:text-[#F4F7FB] border border-white/[0.10] transition cursor-pointer"
          >
            <Camera size={13} className="text-[#43D9BD]" />
            <span>Sign Camera Workspace</span>
          </button>
        </div>

        {}
        <div className="flex-1 rounded-2xl bg-[#191F2B]/75 backdrop-blur-2xl border border-white/[0.10] shadow-[0_12px_40px_rgba(0,0,0,0.5)] apple-specular-edge p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-h-0">
          {}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto space-y-3 pr-1.5 min-h-0 overscroll-contain"
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user"
              const isSystem = msg.source === "system"

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${
                    isSystem
                      ? "items-center text-center"
                      : isUser
                        ? "items-end"
                        : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {renderOriginBadge(msg.source)}
                    <span className="text-[10px] font-mono text-[#737F91]">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`relative group max-w-[88%] sm:max-w-[78%] rounded-xl p-3 text-xs sm:text-sm leading-relaxed ${
                      isSystem
                        ? "bg-white/[0.03] border border-white/[0.06] text-[#A1ACBC] text-xs max-w-md shadow-xs"
                        : isUser
                          ? "bg-[#43D9BD]/12 border border-[#43D9BD]/30 text-[#F4F7FB] rounded-tr-xs shadow-xs"
                          : "bg-[#10141C]/85 border border-white/[0.08] text-[#F4F7FB] rounded-tl-xs shadow-xs"
                    }`}
                    dir={msg.isRTL ? "rtl" : "ltr"}
                  >
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

                    {!isSystem && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/[0.06] flex items-center justify-end gap-1.5 text-xs opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => void handleReplayAudio(msg)}
                          className="p-1 rounded-md text-[#A1ACBC] hover:text-[#43D9BD] hover:bg-white/[0.06] transition cursor-pointer"
                          title="Replay pronunciation aloud"
                          aria-label="Replay pronunciation aloud"
                        >
                          <Volume2 size={12} />
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded-md text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.06] transition cursor-pointer"
                          title="Copy text"
                          aria-label="Copy text"
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

            <div ref={messagesEndRef} className="h-1" />
          </div>

          {}
          {isListeningMic && (
            <div className="my-2 p-2 rounded-xl bg-[#43D9BD]/12 border border-[#43D9BD]/30 backdrop-blur-md flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#43D9BD] animate-pulse" />
                <span className="text-xs text-[#43D9BD] font-mono">
                  Listening:{" "}
                  {micTranscript
                    ? `"${micTranscript}"`
                    : "Speak aloud in Arabic…"}
                </span>
              </div>
              <AudioWaveform
                amplitude={micAmplitude.get()}
                active={true}
                barCount={14}
                color="#43D9BD"
              />
            </div>
          )}

          {}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 shrink-0">
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => setInputVal(chip.text)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer font-arabic"
                dir="rtl"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {}
          <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center gap-2 shrink-0">
            <button
              onClick={toggleVoiceInput}
              className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer shrink-0 ${
                isListeningMic
                  ? "bg-[#43D9BD] text-[#0B0D12] border-[#43D9BD] shadow-[0_0_12px_rgba(67,217,189,0.4)]"
                  : "bg-white/[0.05] text-[#A1ACBC] hover:text-[#F4F7FB] hover:bg-white/[0.09] border-white/[0.10]"
              }`}
              title={
                isListeningMic ? "إيقاف التسجيل الصوتي" : "تحدث عبر الميكروفون"
              }
              aria-label={
                isListeningMic ? "Stop recording voice" : "Speak via microphone"
              }
            >
              {isListeningMic ? <Square size={15} /> : <Mic size={15} />}
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSendText()
                  }
                }}
                placeholder="اكتب رسالة للتواصل أو الاستفسار عن لغة الإشارة…"
                className="w-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/[0.10] focus:border-[#43D9BD]/60 focus:ring-1 focus:ring-[#43D9BD]/40 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#F4F7FB] outline-none transition placeholder:text-[#737F91] text-right font-arabic"
                dir="rtl"
              />
            </div>

            <button
              onClick={handleSendText}
              disabled={!inputVal.trim()}
              className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer shrink-0 ${
                inputVal.trim()
                  ? "bg-[#43D9BD] hover:bg-[#34C7A8] text-[#0B0D12] font-semibold border-[#43D9BD] shadow-xs active:scale-[0.98]"
                  : "bg-white/[0.03] text-white/20 border-white/[0.06] cursor-not-allowed"
              }`}
              title="Send message"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {}
      <aside
        aria-label="MIRA AI Companion"
        className="flex flex-col gap-3 sm:gap-3.5 p-4 sm:p-4.5 rounded-2xl bg-[#191F2B]/75 backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.45)] apple-specular-edge relative overflow-hidden h-fit lg:sticky lg:top-20"
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#43D9BD]/8 to-transparent pointer-events-none" />

        <div className="w-full flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#43D9BD] shadow-[0_0_8px_rgba(67,217,189,0.8)] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#F4F7FB]/80 uppercase font-medium">
              MIRA COMPANION
            </span>
          </div>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-xs text-[#43D9BD] hover:underline font-mono cursor-pointer"
          >
            <Hand size={13} /> <span>Sign Guide</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center z-10 w-full py-1">
          <MirageAvatar
            expression={avatarExpression}
            amplitude={
              isAudioPlaying
                ? amplitude
                : isListeningMic
                  ? micAmplitude.get()
                  : 0
            }
            gaze={gaze}
            size={195}
            statusMessage={
              isAudioPlaying
                ? "Speaking Arabic response aloud…"
                : isListeningMic
                  ? "Listening to voice input…"
                  : "Standby · Ready to observe"
            }
          />
        </div>

        <div className="w-full z-20 pt-1 shrink-0 flex flex-col items-center gap-2.5">
          <AvatarExpressionController />

          <AudioWaveform
            amplitude={
              isAudioPlaying
                ? amplitude
                : isListeningMic
                  ? micAmplitude.get()
                  : 0
            }
            active={isAudioPlaying || isListeningMic}
            barCount={16}
            color="#43D9BD"
          />

          <button
            onClick={toggleVoiceInput}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
              isListeningMic
                ? "bg-[#43D9BD] text-[#0B0D12] border-[#43D9BD] shadow-[0_0_12px_rgba(67,217,189,0.4)]"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#F4F7FB]"
            }`}
          >
            {isListeningMic ? (
              <Square size={13} />
            ) : (
              <Mic size={13} className="text-[#43D9BD]" />
            )}
            <span>
              {isListeningMic
                ? "إيقاف التحدث الصوتي"
                : "تحدث مع الرفيق [Space]"}
            </span>
          </button>

          <div className="text-[10px] font-mono text-[#737F91] tracking-wider text-center">
            Zero-Cloud Vision Privacy · MobileNetV2
          </div>
        </div>
      </aside>
    </div>
  )
}
