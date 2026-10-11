export const runtimeMetrics = {
  microphoneLoops: 0,
  mediaListeners: 0,
}

export function readRuntimeMetrics() {
  return { ...runtimeMetrics }
}

declare global {
  interface Window {
    __mirageMetrics?: typeof readRuntimeMetrics
  }
}
