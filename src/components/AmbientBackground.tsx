"use client"

// Subtle, smooth cursor-responsive ambient lighting (Antigravity Studio style)
// Respect reduced motion and touch devices
// Gentle spring-like interpolation (damping factor 0.04)
/* Stable Dark Foundation */ /* Layer 1: Ambient Top-Left Primary Teal Glow */ /* Layer 2: Ambient Top-Right Sky Cyan Glow */ /* Layer 3: Subtle Center-Bottom Depth Glow */ /* Layer 4: Warm Accent Ambient Glow (Active only in creative/imagine state) */ /* Layer 5: Cursor-Responsive Atmospheric Light (Ultra-Subtle & Smooth) */

import { useEffect, useRef } from "react"
import { useMirageStore } from "@/store/mirageStore"

export default function AmbientBackground() {
  const state = useMirageStore((s) => s.state)
  const isImagine =
    state ===
    "imagine"
  const pointerGlowRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    )
      return
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const isTouch = window.matchMedia("(pointer: coarse)").matches

    if (prefersReducedMotion || isTouch) return

    let currentX =
      window.innerWidth /
      2
    let currentY =
      window.innerHeight /
      3
    let targetX = currentX
    let targetY = currentY
    let animId: number | null = null

    const handlePointerMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const updateGlow = () => {
      currentX += (targetX - currentX) * 0.04
      currentY += (targetY - currentY) * 0.04

      if (pointerGlowRef.current) {
        pointerGlowRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      }
      animId = requestAnimationFrame(updateGlow)
    }

    window.addEventListener("mousemove", handlePointerMove, { passive: true })
    animId = requestAnimationFrame(updateGlow)

    return () => {
      window.removeEventListener("mousemove", handlePointerMove)
      if (animId) cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {}
      <div className="absolute inset-0 bg-[#0B0D12]" />

      {}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(67, 217, 189, 0.06) 0%, rgba(67, 217, 189, 0.015) 45%, transparent 70%)",
        }}
      />

      {}
      <div
        className="absolute top-[5%] -right-[12%] w-[50vw] h-[50vw] max-w-[750px] max-h-[750px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(69, 185, 245, 0.05) 0%, rgba(69, 185, 245, 0.01) 40%, transparent 68%)",
        }}
      />

      {}
      <div
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[45vw] max-w-[900px] max-h-[600px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(25, 31, 43, 0.6) 0%, rgba(16, 20, 28, 0.2) 50%, transparent 75%)",
        }}
      />

      {}
      <div
        className={`absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full transition-opacity duration-1000 ${
          isImagine ? "opacity-40" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(242, 174, 117, 0.06) 0%, transparent 70%)",
        }}
      />

      {}
      <div
        ref={pointerGlowRef}
        className="absolute top-0 left-0 w-[600px] h-[600px] -ml-[300px] -mt-[300px] rounded-full pointer-events-none opacity-30 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(69, 185, 245, 0.035) 0%, rgba(67, 217, 189, 0.015) 35%, transparent 65%)",
          willChange: "transform",
        }}
      />
    </div>
  )
}
