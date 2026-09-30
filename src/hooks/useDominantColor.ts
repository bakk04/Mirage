import { useEffect } from "react"
import { useMirageStore } from "@/store/mirageStore"

interface IdleWindow {
  requestIdleCallback?: (callback: () => void) => number
  cancelIdleCallback?: (handle: number) => void
}

export function useDominantColor(imageUrl: string) {
  const setDominantColor = useMirageStore((store) => store.setDominantColor)

  useEffect(() => {
    let cancelled = false
    let idleHandle: number | undefined
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = imageUrl

    const sample = () => {
      if (cancelled || !image.naturalWidth) return
      const canvas = document.createElement("canvas")
      canvas.width = 32
      canvas.height = 32
      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) return
      context.drawImage(image, 0, 0, 32, 32)
      const pixels = context.getImageData(0, 0, 32, 32).data
      let red = 0
      let green = 0
      let blue = 0
      let count = 0
      for (let index = 0; index < pixels.length; index += 16) {
        if (pixels[index + 3] < 128) continue
        red += pixels[index]
        green += pixels[index + 1]
        blue += pixels[index + 2]
        count += 1
      }
      if (count) {
        setDominantColor(
          `rgb(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)})`,
        )
      }
    }

    const schedule = () => {
      const idleWindow = window as Window & IdleWindow
      if (idleWindow.requestIdleCallback)
        idleHandle = idleWindow.requestIdleCallback(sample)
      else idleHandle = window.setTimeout(sample, 200)
    }

    image.addEventListener("load", schedule, { once: true })
    return () => {
      cancelled = true
      image.removeEventListener("load", schedule)
      if (idleHandle !== undefined) {
        const idleWindow = window as Window & IdleWindow
        if (idleWindow.cancelIdleCallback)
          idleWindow.cancelIdleCallback(idleHandle)
        else window.clearTimeout(idleHandle)
      }
    }
  }, [imageUrl, setDominantColor])
}
