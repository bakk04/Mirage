"use client"

import {
  Camera,
  Cpu,
  Volume2,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
} from "lucide-react"
import { useMirageStore, AVATAR_EXPRESSION_LABELS } from "@/store/mirageStore"

export default function RecognitionPipelineStatus() {
  const cameraActive = useMirageStore((s) => s.cameraActive)
  const cameraPaused = useMirageStore((s) => s.cameraPaused)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const avatarExpression = useMirageStore((s) => s.avatarExpression)

  const items = [
    {
      id: "camera",
      label: "Camera Feed",
      shortLabel: "Camera",
      status: !cameraActive ? "standby" : cameraPaused ? "paused" : "active",
      badge: !cameraActive ? "Standby" : cameraPaused ? "Paused" : "Live",
      icon: <Camera size={13} />,
    },
    {
      id: "mobilenet",
      label: "MobileNetV2 ArSL",
      shortLabel: "ArSL Model",
      status: "awaiting",
      badge: "Awaiting Integration",
      icon: <Cpu size={13} />,
    },
    {
      id: "mediapipe",
      label: "MediaPipe Commands",
      shortLabel: "Gestures",
      status: "awaiting",
      badge: "Awaiting Integration",
      icon: <Sparkles size={13} />,
    },
    {
      id: "speech",
      label: "Speech Synth",
      shortLabel: "TTS",
      status: isAudioPlaying ? "speaking" : "ready",
      badge: isAudioPlaying ? "Speaking" : "Ready",
      icon: <Volume2 size={13} />,
    },
    {
      id: "mira",
      label: "MIRA Companion",
      shortLabel: "Companion",
      status:
        avatarExpression === "speaking"
          ? "speaking"
          : avatarExpression === "observing"
            ? "active"
            : avatarExpression === "listening"
              ? "listening"
              : avatarExpression === "paused"
                ? "paused"
                : "idle",
      badge:
        AVATAR_EXPRESSION_LABELS[avatarExpression]?.split("·")[0]?.trim() ||
        avatarExpression,
      icon: <Bot size={13} />,
    },
  ]

  const getPillStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#3DDBB5]/12 border-[#3DDBB5]/30 text-[#3DDBB5]"
      case "speaking":
        return "bg-[#3DDBB5]/15 border-[#3DDBB5]/40 text-[#3DDBB5]"
      case "listening":
        return "bg-[#38BDF8]/12 border-[#38BDF8]/30 text-[#38BDF8]"
      case "paused":
        return "bg-[#F5A25D]/12 border-[#F5A25D]/30 text-[#F5A25D]"
      case "ready":
        return "bg-emerald-500/12 border-emerald-500/30 text-emerald-400"
      case "awaiting":
        return "bg-[#F5A25D]/10 border-[#F5A25D]/25 text-[#F5A25D]"
      default:
        return "bg-white/[0.04] border-white/10 text-white/50"
    }
  }

  return (
    <div
      role="region"
      aria-label="Recognition Pipeline Status"
      className="w-full px-3 py-2 rounded-2xl bg-[#1A1D25] border border-white/[0.08] shadow-sm flex items-center justify-between gap-2 overflow-x-auto text-xs font-mono"
    >
      <div className="flex items-center gap-2 w-full justify-between">
        {items.map((item) => {
          const pill = getPillStyle(item.status)
          const isLive =
            item.status === "active" ||
            item.status === "speaking" ||
            item.status === "listening"

          return (
            <div
              key={item.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${pill}`}
            >
              <span className="shrink-0 opacity-85" aria-hidden="true">
                {item.icon}
              </span>
              <span className="hidden lg:inline font-medium text-white/90">
                {item.label}:
              </span>
              <span className="inline lg:hidden font-medium text-white/90">
                {item.shortLabel}:
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                {isLive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
                    aria-hidden="true"
                  />
                )}
                {item.status === "awaiting" && (
                  <Clock size={10} className="opacity-80" aria-hidden="true" />
                )}
                {item.status === "ready" && (
                  <CheckCircle2
                    size={10}
                    className="opacity-80"
                    aria-hidden="true"
                  />
                )}
                <span className="whitespace-nowrap font-medium">
                  {item.badge}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

