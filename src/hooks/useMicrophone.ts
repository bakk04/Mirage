import { useCallback, useEffect, useRef, useState } from "react"
import { motionValue, type MotionValue } from "motion/react"
import { runtimeMetrics } from "@/lib/runtimeMetrics"

export type MicrophonePermission = "idle" | "prompting" | "granted" | "denied" | "unavailable" | "error"

export function useMicrophone() {
  const amplitude = useRef(motionValue(0)).current
  const session = useRef<{
    stream: MediaStream
    context: AudioContext
    analyser: AnalyserNode
  } | null>(null)
  const raf = useRef<number | null>(null)
  const active = useRef(false)
  const fallbackTime = useRef(0)
  const [permission, setPermission] = useState<MicrophonePermission>("idle")
  const [error, setError] = useState("")

  const stop = useCallback(() => {
    active.current = false
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = null
    runtimeMetrics.microphoneLoops = 0
    session.current?.stream.getTracks().forEach((track) => track.stop())
    session.current?.analyser.disconnect()
    void session.current?.context.close()
    session.current = null
    fallbackTime.current = 0
    amplitude.set(0)
  }, [amplitude])

  const start = useCallback(async () => {
    if (session.current) return
    if (active.current) {
      active.current = false
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = null
      runtimeMetrics.microphoneLoops = 0
    }
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setPermission("unavailable")
      setError("Microphone access requires HTTPS or localhost.")
      return
    }
    active.current = true
    setPermission("prompting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      const Context = window.AudioContext ?? window.webkitAudioContext
      if (!Context) throw new Error("Web Audio is unavailable")
      const context = new Context()
      await context.resume()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      context.createMediaStreamSource(stream).connect(analyser)
      session.current = { stream, context, analyser }
      setPermission("granted")
      const data = new Uint8Array(analyser.fftSize)
      let smoothed = 0
      const tick = () => {
        if (!active.current) return
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (const value of data) {
          const normalized = (value - 128) / 128
          sum += normalized * normalized
        }
        const raw = Math.min(1, Math.sqrt(sum / data.length) * 2.5)
        smoothed += (raw - smoothed) * 0.15
        amplitude.set(smoothed)
        raf.current = requestAnimationFrame(tick)
      }
      runtimeMetrics.microphoneLoops = 1
      raf.current = requestAnimationFrame(tick)
    } catch (cause) {
      active.current = true
      setPermission(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "denied"
          : "error",
      )
      setError(
        "Microphone access is unavailable. Re-enable it in browser settings and try again.",
      )
      const tickFallback = () => {
        if (!active.current || session.current) return
        fallbackTime.current += 0.02
        const raw =
          (Math.sin(fallbackTime.current * 2.1) * 0.5 + 0.5) *
          (Math.sin(fallbackTime.current * 1.3 + 2) * 0.5 + 0.5) *
          0.15
        amplitude.set(amplitude.get() + (raw - amplitude.get()) * 0.15)
        raf.current = requestAnimationFrame(tickFallback)
      }
      runtimeMetrics.microphoneLoops = 1
      raf.current = requestAnimationFrame(tickFallback)
    }
  }, [amplitude])

  useEffect(() => stop, [stop])
  return {
    amplitude: amplitude as MotionValue<number>,
    permission,
    error,
    start,
    stop,
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
