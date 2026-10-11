import { useCallback, useEffect, useState } from "react"
import { motion } from "motion/react"
import { Camera, CameraOff, RefreshCw, X } from "lucide-react"
import { useCamera } from "@/hooks/useCamera"
import { useMirageStore } from "@/store/mirageStore"

export default function CameraState() {
  const setState = useMirageStore((s) => s.setState)
  const mirrorCamera = useMirageStore((s) => s.settings.mirrorCamera)
  const addMemory = useMirageStore((s) => s.addMemory)
  const setDominantColor = useMirageStore((s) => s.setDominantColor)
  const [captured, setCaptured] = useState(false)
  const {
    videoRef,
    permission,
    error,
    devices,
    facingMode,
    start,
    switchCamera,
    mirrored,
  } = useCamera(true)

  useEffect(() => {
    let frame = 0
    let lastSample = 0
    const canvas = document.createElement("canvas")
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext("2d", { willReadFrequently: true })
    const sample = (time: number) => {
      const video = videoRef.current
      if (
        context &&
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        time - lastSample >= 1000
      ) {
        lastSample = time
        context.drawImage(video, 0, 0, 32, 32)
        const pixels = context.getImageData(0, 0, 32, 32).data
        let r = 0
        let g = 0
        let b = 0
        for (let i = 0; i < pixels.length; i += 16) {
          r += pixels[i]
          g += pixels[i + 1]
          b += pixels[i + 2]
        }
        const count = pixels.length / 16
        setDominantColor(
          `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`,
        )
      }
      frame = requestAnimationFrame(sample)
    }
    frame = requestAnimationFrame(sample)
    return () => cancelAnimationFrame(frame)
  }, [setDominantColor, videoRef])

  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const blobUrl = URL.createObjectURL(blob)
        addMemory({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          label: "Live capture",
          blobUrl,
        })
        setCaptured(true)
        window.setTimeout(() => setCaptured(false), 900)
      },
      "image/jpeg",
      0.88,
    )
  }, [addMemory])

  const permissionScreen =
    permission !== "granted" ? (
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="glass max-w-sm rounded-3xl p-8 text-center">
          <CameraOff
            className="mx-auto mb-5 text-[#5EEAD4]"
            size={28}
            strokeWidth={1.2}
          />
          <p className="text-lg text-white/90">
            MIRAGE needs your camera to see.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/45">
            {permission === "idle"
              ? "Your camera stays on this device and can be stopped at any time."
              : error || "Preparing camera access…"}
          </p>
          {permission !== "unavailable" && (
            <button
              className="mt-6 min-h-11 rounded-full border border-[#5EEAD4]/40 bg-[#5EEAD4]/10 px-5 text-sm text-[#5EEAD4] transition hover:bg-[#5EEAD4]/20"
              onClick={() => void start()}
            >
              {permission === "prompting"
                ? "Waiting for permission…"
                : permission === "denied"
                  ? "Try again"
                  : "Allow camera"}
            </button>
          )}
        </div>
      </div>
    ) : null

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl bg-[#080A0D]"
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(100% at 50% 50%)" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <video
        ref={videoRef}
        data-camera-video
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full rounded-3xl object-cover"
        style={{
          transform: mirrorCamera && mirrored ? "scaleX(-1)" : undefined,
        }}
      />
      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,transparent_40%,rgba(8,10,13,0.7)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#080A0D]/60 to-transparent" />
      {permissionScreen}
      {permission === "granted" && (
        <>
          <div className="absolute right-5 top-5 flex items-center gap-2 text-xs tracking-[0.15em] text-white/60">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#5EEAD4]" />{" "}
            LIVE
          </div>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
            {devices.length > 1 && (
              <button
                className="glass flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/70"
                aria-label={`Switch to ${
                  facingMode === "user" ? "back" : "front"
                } camera`}
                title="Switch camera"
                onClick={switchCamera}
              >
                <RefreshCw size={17} />
              </button>
            )}
            <button
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/60 bg-white/10 text-white shadow-lg"
              aria-label="Capture camera frame"
              title="Capture"
              onClick={capture}
            >
              <span
                className={`h-11 w-11 rounded-full border-2 border-[#5EEAD4] ${
                  captured ? "bg-[#5EEAD4]/40" : ""
                }`}
              />
            </button>
            <button
              className="glass flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/70"
              aria-label="Close camera"
              title="Close camera"
              onClick={() => setState("idle")}
            >
              <X size={17} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}
