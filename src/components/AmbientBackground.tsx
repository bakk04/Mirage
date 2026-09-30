"use client" /* Mesh gradient blobs */ /* Blob 1 - turquoise, top-left */ /* Blob 2 - deep blue, right */ /* Blob 3 - near-black, bottom */ /* Orange blob — imagine only */ /* Film grain */
import { useMirageStore } from "@/store/mirageStore"

export default function AmbientBackground() {
  const state = useMirageStore((s) => s.state)
  const dominantColor = useMirageStore((s) => s.dominantColor)
  const isImagine = state === "imagine"

  return (
    <>
      {}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {}
        <div
          className="absolute"
          style={{
            width: "70vw",
            height: "70vw",
            top: "-20%",
            left: "-20%",
            animation: "drift 35s ease-in-out infinite",
            willChange: "transform",
            transition: "opacity 2s ease, background 1.2s ease",
            background: `radial-gradient(circle, color-mix(in srgb, ${dominantColor} 18%, transparent) 0%, transparent 70%)`,
            opacity: isImagine ? 0.12 : 0.1,
          }}
        />
        {}
        <div
          className="absolute"
          style={{
            width: "60vw",
            height: "60vw",
            top: "20%",
            right: "-15%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
            animation: "drift2 40s ease-in-out infinite",
            willChange: "transform",
            opacity: 0.08,
          }}
        />
        {}
        <div
          className="absolute"
          style={{
            width: "50vw",
            height: "50vw",
            bottom: "-10%",
            left: "25%",
            background:
              "radial-gradient(circle, rgba(14,165,164,0.07) 0%, transparent 70%)",
            animation: "drift3 30s ease-in-out infinite",
            willChange: "transform",
            opacity: 0.07,
          }}
        />
        {}
        <div
          className="absolute"
          style={{
            width: "50vw",
            height: "50vw",
            bottom: "10%",
            right: "10%",
            background:
              "radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)",
            opacity: isImagine ? 0.08 : 0,
            transition: "opacity 2s ease",
            willChange: "transform",
            animation: "drift 38s ease-in-out infinite reverse",
          }}
        />
      </div>

      {}
      <div className="grain-overlay" aria-hidden="true" />
    </>
  )
}
