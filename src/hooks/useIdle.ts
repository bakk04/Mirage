import { useCallback, useEffect, useRef } from "react"

export function useIdle(onIdle: () => void, delay: number) {
  const callback = useRef(onIdle)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  callback.current = onIdle

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => callback.current(), delay)
  }, [delay])

  useEffect(() => {
    reset()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [reset])

  return reset
}
