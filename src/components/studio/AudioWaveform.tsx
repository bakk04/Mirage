"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"

interface AudioWaveformProps {
  amplitude: number
  active: boolean
  barCount?: number
  color?: string
}

export default function AudioWaveform({
  amplitude,
  active,
  barCount = 18,
  color = "#5EEAD4",
}: AudioWaveformProps) {
  // Generate waveform bars dynamically based on actual amplitude
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Normal distribution envelope across the center
    const centerFactor = Math.sin((i / (barCount - 1)) * Math.PI)
    const baseHeight = active ? 4 : 2
    const dynamicHeight = active ? Math.min(28, baseHeight + amplitude * 34 * centerFactor) : baseHeight

    return { id: i, height: dynamicHeight }
  })

  return (
    <div className="flex items-center justify-center gap-[3px] h-8 px-2">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-[2.5px] rounded-full transition-all duration-75"
          style={{
            height: `${bar.height}px`,
            backgroundColor: active ? color : "rgba(255, 255, 255, 0.15)",
            boxShadow: active && bar.height > 6 ? `0 0 8px ${color}` : "none",
          }}
        />
      ))}
    </div>
  )
}
