import { useEffect, useRef } from "react"
import type { MirageStateType } from "@/store/mirageStore"

export function useStateLifecycle(
  state: MirageStateType,
  hooks: {
    onEnter?: (state: MirageStateType) => void
    onExit?: (state: MirageStateType) => void
  },
) {
  const previous = useRef<MirageStateType | null>(null)
  const onEnter = useRef(hooks.onEnter)
  const onExit = useRef(hooks.onExit)
  onEnter.current = hooks.onEnter
  onExit.current = hooks.onExit

  useEffect(() => {
    if (previous.current !== null && previous.current !== state) {
      onExit.current?.(previous.current)
    }
    onEnter.current?.(state)
    previous.current = state
  }, [state])

  useEffect(
    () => () => {
      if (previous.current) onExit.current?.(previous.current)
    },
    [],
  )
}
