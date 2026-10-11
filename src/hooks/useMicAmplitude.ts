import { useMicrophone } from "./useMicrophone"

/** Backwards-compatible name for the gesture-gated microphone analyser. */
export function useMicAmplitude() {
  return useMicrophone()
}
