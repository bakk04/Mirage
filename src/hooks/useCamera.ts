import { useCallback, useEffect, useRef, useState } from "react"
import { runtimeMetrics } from "@/lib/runtimeMetrics"

export type CameraPermission = "idle" | "prompting" | "granted" | "denied" | "unavailable" | "error"

export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const requestedRef = useRef(false)
  const hiddenAtRef = useRef<number | null>(null)
  const [permission, setPermission] = useState<CameraPermission>("idle")
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [error, setError] = useState("")

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    requestedRef.current = false
  }, [])

  const start = useCallback(
    async (requestedFacing = facingMode) => {
      if (requestedRef.current || streamRef.current) return
      if (
        typeof window === "undefined" ||
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setPermission("unavailable")
        setError(
          "Camera access requires a secure browser context (HTTPS or localhost).",
        )
        return
      }
      requestedRef.current = true
      setPermission("prompting")
      setError("")
      try {
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: requestedFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          })
        } catch (firstError) {
          if (requestedFacing !== "user") {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: "user" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            })
            setFacingMode("user")
          } else {
            throw firstError
          }
        }
        streamRef.current = stream
        stream.getVideoTracks().forEach((track) =>
          track.addEventListener("ended", () => {
            stop()
            setPermission("error")
            setError("The camera was disconnected. Reconnect it and try again.")
          }),
        )
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setPermission("granted")
        const all = await navigator.mediaDevices.enumerateDevices()
        setDevices(all.filter((device) => device.kind === "videoinput"))
      } catch (cause) {
        requestedRef.current = false
        const name = cause instanceof DOMException ? cause.name : ""
        setPermission(name === "NotAllowedError" ? "denied" : "error")
        setError(
          name === "NotAllowedError"
            ? "Camera access is blocked. Re-enable it in your browser site settings, then try again."
            : "The camera could not be started. Check that it is connected and try again.",
        )
      }
    },
    [facingMode],
  )

  const switchCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user"
    setFacingMode(next)
    stop()
    void start(next)
  }, [facingMode, start, stop])

  useEffect(() => {
    if (!active) {
      stop()
      return
    }
    const onDeviceChange = () => {
      void navigator.mediaDevices
        ?.enumerateDevices()
        .then((all) =>
          setDevices(all.filter((device) => device.kind === "videoinput")),
        )
    }
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now()
      } else if (
        hiddenAtRef.current &&
        Date.now() - hiddenAtRef.current > 30_000
      ) {
        stop()
      } else if (!streamRef.current && requestedRef.current) {
        void start()
      }
    }
    const onEnded = () => {
      stop()
      setPermission("error")
      setError("The camera was disconnected. Reconnect it and try again.")
    }
    navigator.mediaDevices?.addEventListener("devicechange", onDeviceChange)
    runtimeMetrics.mediaListeners += 1
    document.addEventListener("visibilitychange", onVisibility)
    streamRef.current
      ?.getVideoTracks()
      .forEach((track) => track.addEventListener("ended", onEnded))
    return () => {
      navigator.mediaDevices?.removeEventListener(
        "devicechange",
        onDeviceChange,
      )
      runtimeMetrics.mediaListeners = Math.max(
        0,
        runtimeMetrics.mediaListeners - 1,
      )
      document.removeEventListener("visibilitychange", onVisibility)
      stop()
    }
  }, [active, start, stop])

  return {
    videoRef,
    permission,
    error,
    devices,
    facingMode,
    start,
    stop,
    switchCamera,
    mirrored: facingMode === "user",
  }
}
