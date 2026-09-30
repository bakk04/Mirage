import { useCallback, useEffect, useRef, useState } from "react"

interface MicSession {
  context: AudioContext
  stream: MediaStream
  source: MediaStreamAudioSourceNode
  analyser: AnalyserNode
  data: Uint8Array<ArrayBuffer>
}

export function useMicAmplitude() {
  const [amplitude, setAmplitude] = useState(0)
  const session = useRef<MicSession | null>(null)
  const frame = useRef<number | undefined>(undefined)
  const fallbackTime = useRef(0)
  const active = useRef(false)
  const tickRef = useRef<() => void>(() => {})

  const start = useCallback(async () => {
    if (session.current || !navigator.mediaDevices?.getUserMedia) return
    active.current = true
    if (!frame.current)
      frame.current = requestAnimationFrame(() => tickRef.current())

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
      if (!AudioContextClass) throw new Error("Web Audio is unavailable")
      const context = new AudioContextClass()
      await context.resume()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      session.current = {
        context,
        stream,
        source,
        analyser,
        data: new Uint8Array(analyser.frequencyBinCount),
      }
    } catch {
      active.current = true
    }
  }, [])

  useEffect(() => {
    let previous = 0
    tickRef.current = () => {
      if (!active.current) {
        frame.current = undefined
        return
      }
      const current = session.current
      let raw = 0
      if (current) {
        current.analyser.getByteFrequencyData(current.data)
        let sum = 0
        for (const value of current.data) sum += value
        raw = sum / (current.data.length * 255)
      } else {
        fallbackTime.current += 0.02
        raw =
          (Math.sin(fallbackTime.current * 2.1) * 0.5 + 0.5) *
          (Math.sin(fallbackTime.current * 1.3 + 2) * 0.5 + 0.5) *
          0.15
      }
      previous += (raw - previous) * 0.15
      setAmplitude(previous)
      frame.current = requestAnimationFrame(() => tickRef.current())
    }

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      const current = session.current
      current?.stream.getTracks().forEach((track) => track.stop())
      current?.source.disconnect()
      void current?.context.close()
      session.current = null
      active.current = false
      tickRef.current = () => {}
    }
  }, [])

  return { amplitude, start }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
