"use client"

import {
  Camera,
  Cpu,
  Globe,
  Volume2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Bot,
} from "lucide-react"
import { useMirageStore, AVATAR_EXPRESSION_LABELS } from "@/store/mirageStore"

export default function RecognitionPipelineStatus() {
  const cameraActive = useMirageStore((s) => s.cameraActive)
  const cameraPaused = useMirageStore((s) => s.cameraPaused)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const sessionStatus = useMirageStore((s) => s.sessionStatus)
  const accumulatedArabicSigns = useMirageStore((s) => s.accumulatedArabicSigns)

  const stages = [
    {
      id: "camera",
      label: "Live Camera",
      subtext: !cameraActive
        ? "Offline"
        : cameraPaused
          ? "Stream Paused"
          : "Active Stream",
      icon: <Camera size={13} />,
      status: !cameraActive ? "standby" : cameraPaused ? "paused" : "active",
      badgeText: !cameraActive ? "Standby" : cameraPaused ? "Paused" : "Live",
    },
    {
      id: "mobilenet",
      label: "MobileNetV2 (ArSL)",
      subtext: "Arabic Sign Language",
      icon: <Cpu size={13} />,
      status: "awaiting",
      badgeText: "Awaiting Integration",
    },
    {
      id: "mediapipe",
      label: "MediaPipe Recognizer",
      subtext: "Interface Commands",
      icon: <Sparkles size={13} />,
      status: "awaiting",
      badgeText: "Awaiting Integration",
    },
    {
      id: "speech",
      label: "Speech Synthesis",
      subtext: isAudioPlaying ? "Playing Audio" : "Arabic Synthesizer",
      icon: <Volume2 size={13} />,
      status: isAudioPlaying ? "active" : "ready",
      badgeText: isAudioPlaying ? "Speaking" : "Ready",
    },
    {
      id: "avatar",
      label: "MIRA Avatar",
      subtext: AVATAR_EXPRESSION_LABELS[avatarExpression] || avatarExpression,
      icon: <Bot size={13} />,
      status:
        avatarExpression === "speaking"
          ? "active"
          : avatarExpression === "observing"
            ? "observing"
            : avatarExpression === "listening"
              ? "listening"
              : avatarExpression === "paused"
                ? "paused"
                : "idle",
      badgeText:
        avatarExpression === "speaking"
          ? "Speaking"
          : avatarExpression === "observing"
            ? "Observing"
            : avatarExpression === "listening"
              ? "Listening"
              : avatarExpression === "paused"
                ? "Paused"
                : "Resting",
    },
  ]

  const getStatusBadge = (status: string, badgeText: string) => {
    switch (status) {
      case "active":
      case "observing":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#5EEAD4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4] animate-pulse" />
            {badgeText}
          </span>
        )
      case "listening":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#22D3EE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
            {badgeText}
          </span>
        )
      case "paused":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#FB923C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" />
            {badgeText}
          </span>
        )
      case "ready":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399]">
            <CheckCircle2 size={10} />
            {badgeText}
          </span>
        )
      case "awaiting":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400/90">
            <Clock size={9} />
            {badgeText}
          </span>
        )
      default: // standby / idle
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-white/35">
            <Clock size={9} />
            {badgeText}
          </span>
        )
    }
  }

  return (
    <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-[#121620]/90 border border-white/[0.06] backdrop-blur-md">
      {/* Stages Row */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 sm:pb-0">
        {stages.map((st, idx) => {
          const isActive = st.status === "active" || st.status === "observing" || st.status === "listening"
          const isAwaiting = st.status === "awaiting"

          return (
            <div key={st.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-[110px]">
              <div
                className={`flex-1 flex flex-col gap-1 p-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 shadow-[0_0_12px_rgba(94,234,212,0.12)]"
                    : isAwaiting
                      ? "bg-amber-500/[0.04] border border-amber-500/20"
                      : "bg-white/[0.02] border border-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`${
                      isActive
                        ? "text-[#5EEAD4]"
                        : isAwaiting
                          ? "text-amber-400"
                          : "text-white/40"
                    }`}
                  >
                    {st.icon}
                  </span>
                  {getStatusBadge(st.status, st.badgeText)}
                </div>

                <div className="mt-0.5">
                  <p className="text-[11px] font-medium text-white/90 leading-tight truncate">
                    {st.label}
                  </p>
                  <p className="text-[9px] font-mono text-white/40 leading-tight truncate">
                    {st.subtext}
                  </p>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <ChevronRight size={12} className="text-white/20 shrink-0 hidden sm:block" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
