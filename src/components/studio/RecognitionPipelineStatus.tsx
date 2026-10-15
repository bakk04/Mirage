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
  const mobileNetStatus = useMirageStore((s) => s.mobileNetStatus)
  const mediaPipeStatus = useMirageStore((s) => s.mediaPipeStatus)

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
      label: "ArSL CNN Model",
      shortLabel: "ArSL Model",
      status:
        mobileNetStatus === "ready"
          ? "ready"
          : mobileNetStatus === "initializing"
            ? "active"
            : mobileNetStatus === "error"
              ? "error"
              : "awaiting",
      badge:
        mobileNetStatus === "ready"
          ? "Ready (32 Classes)"
          : mobileNetStatus === "initializing"
            ? "Initializing"
            : mobileNetStatus === "error"
              ? "Offline"
              : "Awaiting Integration",
      icon: <Cpu size={13} />,
    },
    {
      id: "mediapipe",
      label: "MediaPipe Commands",
      shortLabel: "Gestures",
      status:
        mediaPipeStatus === "ready"
          ? "ready"
          : mediaPipeStatus === "initializing"
            ? "active"
            : mediaPipeStatus === "error"
              ? "error"
              : "awaiting",
      badge:
        mediaPipeStatus === "ready"
          ? "Ready (Vision Task)"
          : mediaPipeStatus === "initializing"
            ? "Initializing"
            : mediaPipeStatus === "error"
              ? "Error"
              : "Awaiting Integration",
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
      case "speaking":
      case "listening":
        return "bg-[#43D9BD]/12 border-[#43D9BD]/30 text-[#43D9BD]"
      case "paused":
        return "bg-[#F2AE75]/12 border-[#F2AE75]/30 text-[#F2AE75]"
      case "ready":
        return "bg-[#43D9BD]/10 border-[#43D9BD]/25 text-[#43D9BD]"
      case "awaiting":
        return "bg-white/[0.03] border-white/[0.08] text-[#A1ACBC]"
      default:
        return "bg-white/[0.02] border-white/[0.06] text-[#A1ACBC]"
    }
  }

  return (
    <div
      role="region"
      aria-label="Recognition Pipeline Status"
      className="w-full px-2.5 py-1.5 rounded-xl bg-[#10141C]/80 border border-white/[0.08] shadow-xs flex items-center justify-between gap-1.5 overflow-x-auto text-xs font-mono"
    >
      <div className="flex items-center gap-1.5 w-full justify-between">
        {items.map((item) => {
          const pill = getPillStyle(item.status)
          const isLive =
            item.status === "active" ||
            item.status === "speaking" ||
            item.status === "listening"

          return (
            <div
              key={item.id}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border transition-colors shrink-0 ${pill}`}
            >
              <span className="shrink-0 opacity-80" aria-hidden="true">
                {item.icon}
              </span>
              <span className="hidden lg:inline font-medium text-[#F4F7FB]">
                {item.label}:
              </span>
              <span className="inline lg:hidden font-medium text-[#F4F7FB]">
                {item.shortLabel}:
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                {isLive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
                    aria-hidden="true"
                  />
                )}
                {item.status === "awaiting" && (
                  <Clock
                    size={10}
                    className="opacity-70 text-[#A1ACBC]"
                    aria-hidden="true"
                  />
                )}
                {item.status === "ready" && (
                  <CheckCircle2
                    size={10}
                    className="opacity-80 text-[#43D9BD]"
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
