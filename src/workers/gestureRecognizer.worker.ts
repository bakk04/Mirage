import {
  FilesetResolver,
  GestureRecognizer,
  type GestureRecognizerResult,
} from "@mediapipe/tasks-vision"

type InitMessage = {
  type: "init"
  modelAssetUrl: string
  wasmRootUrl: string
}

type FrameMessage = {
  type: "frame"
  id: number
  bitmap: ImageBitmap
}

let recognizer: GestureRecognizer | null = null

function serialise(result: GestureRecognizerResult) {
  return {
    gestures: result.gestures.map((categories) =>
      categories.map((category) => ({
        categoryName: category.categoryName,
        score: category.score,
      })),
    ),
    landmarks: result.landmarks.map((points) =>
      points.map(({ x, y, z }) => ({ x, y, z })),
    ),
    handedness: result.handedness.map((categories) =>
      categories.map((category) => ({
        categoryName: category.categoryName,
        score: category.score,
      })),
    ),
  }
}

self.onmessage = async (event: MessageEvent<InitMessage | FrameMessage>) => {
  try {
    if (event.data.type === "init") {
      const vision = await FilesetResolver.forVisionTasks(
        event.data.wasmRootUrl,
      )
      recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: event.data.modelAssetUrl },
        runningMode: "IMAGE",
        numHands: 2,
        cannedGesturesClassifierOptions: { scoreThreshold: 0.8 },
      })
      self.postMessage({ type: "ready" })
      return
    }

    if (!recognizer) throw new Error("Gesture recognizer is not initialized")
    const result = recognizer.recognize(event.data.bitmap)
    event.data.bitmap.close()
    self.postMessage({
      type: "result",
      id: event.data.id,
      result: serialise(result),
    })
  } catch (error) {
    if (event.data.type === "frame") event.data.bitmap.close()
    self.postMessage({
      type: "error",
      message:
        error instanceof Error ? error.message : "Gesture recognition failed",
    })
  }
}
