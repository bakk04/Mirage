"use client"
import { create } from "zustand"

export type MirageStateType = "idle" | "listening" | "camera" | "understanding" | "conversation" | "speaking" | "memory" | "imagine"

export interface Message {
  id: string
  role: "user" | "mirage"
  content: string
  timestamp: Date
}

interface MirageStore {
  state: MirageStateType
  amplitude: number
  dominantColor: string
  messages: Message[]
  soundEnabled: boolean
  setState: (s: MirageStateType) => void
  setAmplitude: (a: number) => void
  setDominantColor: (c: string) => void
  addMessage: (m: Message) => void
  toggleSound: () => void
}

export const useMirageStore = create<MirageStore>((set) => ({
  state: "idle",
  amplitude: 0,
  dominantColor: "#5EEAD4",
  soundEnabled: false,
  messages: [
    {
      id: "1",
      role: "user",
      content: "What am I holding?",
      timestamp: new Date(),
    },
    {
      id: "2",
      role: "mirage",
      content:
        "A coffee cup. The warmth in your hands, the quiet ritual of a morning beginning. I recognize it — and more, I understand what it means to you.",
      timestamp: new Date(),
    },
  ],
  setState: (s) => set({ state: s }),
  setAmplitude: (a) => set({ amplitude: a }),
  setDominantColor: (c) => set({ dominantColor: c }),
  addMessage: (m) => set((prev) => ({ messages: [...prev.messages, m] })),
  toggleSound: () => set((prev) => ({ soundEnabled: !prev.soundEnabled })),
}))

export const STATE_LABELS: Record<MirageStateType, string> = {
  idle: "Ready",
  listening: "Listening",
  camera: "Seeing",
  understanding: "Understanding",
  conversation: "Thinking",
  speaking: "Speaking",
  memory: "Remembering",
  imagine: "Imagining",
}

export const STATE_ORDER: MirageStateType[] = [
  "idle",
  "listening",
  "camera",
  "understanding",
  "conversation",
  "speaking",
  "memory",
  "imagine",
]
