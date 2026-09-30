import { useCallback, useEffect, useRef } from "react"

interface LongPressOptions {
  duration?: number
  onLongPress?: () => void
  onClick?: () => void
}

export function useLongPress({
  duration = 300,
  onLongPress,
  onClick,
}: LongPressOptions) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longPressed = useRef(false)

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = undefined
  }, [])

  const onPointerDown = useCallback(() => {
    longPressed.current = false
    timer.current = setTimeout(() => {
      longPressed.current = true
      onLongPress?.()
      if ("vibrate" in navigator) navigator.vibrate?.(10)
    }, duration)
  }, [duration, onLongPress])

  const onPointerUp = useCallback(() => {
    clear()
    if (!longPressed.current) onClick?.()
  }, [clear, onClick])

  useEffect(() => clear, [clear])

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: clear,
    onPointerLeave: clear,
  }
}
