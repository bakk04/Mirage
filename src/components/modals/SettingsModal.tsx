"use client"

import { motion } from "motion/react"
import {
  Settings,
  X,
  Volume2,
  Camera,
  Hand,
  Sliders,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import {
  useMirageStore,
  SIGN_LANGUAGES,
  SPOKEN_LANGUAGES,
} from "@/store/mirageStore"
import type { SignLanguageCode, SpokenLanguageCode } from "@/types/mirage"

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl rounded-3xl bg-[#0F141C] border border-white/10 p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#5EEAD4]/10 text-[#5EEAD4]">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-medium text-white/95">
                MIRAGE Configuration & Preferences
              </h3>
              <p className="text-xs text-white/50">
                Language pipelines, speech synthesis, and gesture sensitivity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto mt-4 py-1 space-y-5 pr-1 text-xs">
          {/* Section: Language Pairing */}
          <div>
            <h4 className="font-mono text-white/40 uppercase tracking-wider mb-2.5">
              Multilingual Pipeline
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-white/70 font-medium">Source Sign Language</span>
                <select
                  value={settings.signLanguage}
                  onChange={(e) =>
                    updateSettings({
                      signLanguage: e.target.value as SignLanguageCode,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-xl p-2 text-white/90 outline-none"
                >
                  {SIGN_LANGUAGES.map((sl) => (
                    <option key={sl.code} value={sl.code} className="bg-[#11151A]">
                      {sl.name} ({sl.nativeName})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-white/70 font-medium">Target Spoken Language</span>
                <select
                  value={settings.spokenLanguage}
                  onChange={(e) =>
                    updateSettings({
                      spokenLanguage: e.target.value as SpokenLanguageCode,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-xl p-2 text-white/90 outline-none"
                >
                  {SPOKEN_LANGUAGES.map((sp) => (
                    <option key={sp.code} value={sp.code} className="bg-[#11151A]">
                      {sp.name} ({sp.nativeName})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Section: Speech & Audio */}
          <div>
            <h4 className="font-mono text-white/40 uppercase tracking-wider mb-2.5">
              Speech & Audio Output
            </h4>
            <div className="space-y-2 p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white/90 font-medium block">
                    Auto-Speak Translated Sentences
                  </span>
                  <span className="text-white/40 text-[11px]">
                    Automatically vocalize completed translations aloud
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSpeak}
                  onChange={(e) => updateSettings({ autoSpeak: e.target.checked })}
                  className="w-4 h-4 rounded text-[#5EEAD4] accent-[#5EEAD4]"
                />
              </label>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white/90 font-medium block">Speech Rate</span>
                  <span className="text-white/40 text-[11px]">
                    Current: {settings.speechRate}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={settings.speechRate}
                  onChange={(e) =>
                    updateSettings({ speechRate: Number.parseFloat(e.target.value) })
                  }
                  className="w-32 accent-[#5EEAD4]"
                />
              </div>
            </div>
          </div>

          {/* Section: Vision & Hand Tracking */}
          <div>
            <h4 className="font-mono text-white/40 uppercase tracking-wider mb-2.5">
              Vision & Gesture Interaction
            </h4>
            <div className="space-y-3 p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white/90 font-medium block">
                    Render 21 Hand Landmarks
                  </span>
                  <span className="text-white/40 text-[11px]">
                    Visual skeletal joints and bone connectors on video stream
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLandmarks}
                  onChange={(e) =>
                    updateSettings({ showLandmarks: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#5EEAD4]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white/90 font-medium block">
                    Mirror Camera Feed
                  </span>
                  <span className="text-white/40 text-[11px]">
                    Flip video horizontally for natural mirror feel
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.mirrorCamera}
                  onChange={(e) =>
                    updateSettings({ mirrorCamera: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#5EEAD4]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white/90 font-medium block">
                    Gesture Commands Active
                  </span>
                  <span className="text-white/40 text-[11px]">
                    Control application state with designated physical gestures
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gestureCommandsEnabled}
                  onChange={(e) =>
                    updateSettings({ gestureCommandsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#5EEAD4]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white/90 font-medium block">
                    Confirmation for Sensitive Commands
                  </span>
                  <span className="text-white/40 text-[11px]">
                    Require confirmation timer for stopping session or clearing
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireConfirmation}
                  onChange={(e) =>
                    updateSettings({ requireConfirmation: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#5EEAD4]"
                />
              </label>
            </div>
          </div>

          {/* Section: Accessibility */}
          <div>
            <h4 className="font-mono text-white/40 uppercase tracking-wider mb-2.5">
              Accessibility
            </h4>
            <div className="space-y-3 p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white/90 font-medium block">
                    Reduce Motion
                  </span>
                  <span className="text-white/40 text-[11px]">
                    Minimize 3D orb drift and avatar facial micro-transitions
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) =>
                    updateSettings({ reduceMotion: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#5EEAD4]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white/90 font-medium block">
                    Technical HUD Overlay
                  </span>
                  <span className="text-white/40 text-[11px]">
                    Show FPS, inference latency, and tracking stats in corner
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showDiagnosticsHUD}
                  onChange={(e) =>
                    updateSettings({ showDiagnosticsHUD: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#5EEAD4]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#5EEAD4] text-black font-medium hover:bg-[#3DDBB5] transition"
          >
            Save Preferences
          </button>
        </div>
      </motion.div>
    </div>
  )
}
