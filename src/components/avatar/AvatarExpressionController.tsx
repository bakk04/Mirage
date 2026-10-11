"use client"

import { useMirageStore, AVATAR_EXPRESSION_LABELS } from "@/store/mirageStore"
import type { AvatarExpressionState } from "@/types/mirage"
import { getStateColors } from "@/components/avatar/AvatarStateMachine"

export default function AvatarExpressionController() {
  const avatarExpression = useMirageStore((s) => s.avatarExpression)
  const setAvatarExpression = useMirageStore((s) => s.setAvatarExpression)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)

  const states: { id: AvatarExpressionState; label: string }[] = [
    { id: "idle", label: "Idle" },
    { id: "observing", label: "Observing" },
    { id: "listening", label: "Listening" },
    { id: "thinking", label: "Thinking" },
    { id: "speaking", label: "Speaking" },
    { id: "understanding", label: "Understood" },
    { id: "happy", label: "Happy" },
    { id: "curious", label: "Curious" },
    { id: "confused", label: "Confused" },
    { id: "reassuring", label: "Reassuring" },
    { id: "success", label: "Success" },
    { id: "error", label: "Error" },
    { id: "paused", label: "Paused" },
  ]

  const activeColors = getStateColors(avatarExpression)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Active Expression Pill */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: activeColors.primary }}
        />
        <span className="text-xs font-mono tracking-wider text-white/80 uppercase">
          {AVATAR_EXPRESSION_LABELS[avatarExpression] || avatarExpression}
        </span>
        {isAudioPlaying && (
          <span
            className="w-3 h-3 rounded-full animate-pulse opacity-70"
            style={{ backgroundColor: activeColors.primary }}
          />
        )}
      </div>

      {/* Interactive Expression Palette */}
      <div className="hidden sm:flex flex-wrap items-center justify-center gap-1 max-w-lg p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
        {states.map(({ id, label }) => {
          const isActive = avatarExpression === id
          const stateColors = getStateColors(id)
          return (
            <button
              key={id}
              onClick={() => setAvatarExpression(id)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono tracking-wider transition-all ${
                isActive
                  ? "font-medium border"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: `${stateColors.primary}20`,
                      color: stateColors.primary,
                      borderColor: `${stateColors.primary}66`,
                    }
                  : undefined
              }
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
