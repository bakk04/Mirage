"use client" /* Header */ /* Settings Body */ /* Section: Language Pairing */ /* Section: Speech & Audio */ /* Section: Vision & Hand Tracking */ /* Section: Accessibility */ /* Footer */
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-xl rounded-2xl bg-[#191F2B]/95 border border-white/[0.12] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh] overflow-hidden apple-specular-edge"
      >
        {}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#43D9BD]/12 text-[#43D9BD] border border-[#43D9BD]/25">
              <Settings size={17} />
            </div>
            <div>
              <h3
                id="settings-modal-title"
                className="text-sm font-semibold text-[#F4F7FB]"
              >
                MIRAGE Configuration & Preferences
              </h3>
              <p className="text-xs text-[#A1ACBC]">
                Language pipelines, speech synthesis, and gesture sensitivity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer"
            aria-label="Close settings"
          >
            <X size={17} />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto mt-3.5 py-1 space-y-4.5 pr-1 text-xs">
          {}
          <div>
            <h4 className="font-mono text-[#737F91] uppercase tracking-wider mb-2">
              Multilingual Pipeline
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[#F4F7FB] font-medium">
                  Source Sign Language
                </span>
                <select
                  value={settings.signLanguage}
                  onChange={(e) =>
                    updateSettings({
                      signLanguage: e.target.value as SignLanguageCode,
                    })
                  }
                  className="bg-[#10141C] border border-white/[0.10] rounded-lg p-2 text-[#F4F7FB] outline-none text-xs"
                >
                  {SIGN_LANGUAGES.map((sl) => (
                    <option
                      key={sl.code}
                      value={sl.code}
                      className="bg-[#10141C]"
                    >
                      {sl.name} ({sl.nativeName})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[#F4F7FB] font-medium">
                  Target Spoken Language
                </span>
                <select
                  value={settings.spokenLanguage}
                  onChange={(e) =>
                    updateSettings({
                      spokenLanguage: e.target.value as SpokenLanguageCode,
                    })
                  }
                  className="bg-[#10141C] border border-white/[0.10] rounded-lg p-2 text-[#F4F7FB] outline-none text-xs"
                >
                  {SPOKEN_LANGUAGES.map((sp) => (
                    <option
                      key={sp.code}
                      value={sp.code}
                      className="bg-[#10141C]"
                    >
                      {sp.name} ({sp.nativeName})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {}
          <div>
            <h4 className="font-mono text-[#737F91] uppercase tracking-wider mb-2">
              Speech & Audio Output
            </h4>
            <div className="space-y-2.5 p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Auto-Speak Translated Sentences
                  </span>
                  <span className="text-[#737F91] text-[11px]">
                    Automatically vocalize completed translations aloud
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSpeak}
                  onChange={(e) =>
                    updateSettings({ autoSpeak: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#43D9BD]"
                />
              </label>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Speech Rate
                  </span>
                  <span className="text-[#737F91] text-[11px]">
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
                    updateSettings({
                      speechRate: Number.parseFloat(e.target.value),
                    })
                  }
                  className="w-32 accent-[#43D9BD]"
                />
              </div>
            </div>
          </div>

          {}
          <div>
            <h4 className="font-mono text-[#737F91] uppercase tracking-wider mb-2">
              Vision & Gesture Interaction
            </h4>
            <div className="space-y-2.5 p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Render 21 Hand Landmarks
                  </span>
                  <span className="text-[#737F91] text-[11px]">
                    Visual skeletal joints and bone connectors on video stream
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLandmarks}
                  onChange={(e) =>
                    updateSettings({ showLandmarks: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#43D9BD]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Mirror Camera Feed
                  </span>
                  <span className="text-[#737F91] text-[11px]">
                    Flip video horizontally for natural mirror feel
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.mirrorCamera}
                  onChange={(e) =>
                    updateSettings({ mirrorCamera: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#43D9BD]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Gesture Commands Active
                  </span>
                  <span className="text-[#737F91] text-[11px]">
                    Control application state with designated physical gestures
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gestureCommandsEnabled}
                  onChange={(e) =>
                    updateSettings({ gestureCommandsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#43D9BD]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Confirmation for Sensitive Commands
                  </span>
                  <span className="text-[#737F91] text-[11px]">
                    Require confirmation timer for stopping session or clearing
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireConfirmation}
                  onChange={(e) =>
                    updateSettings({ requireConfirmation: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#43D9BD]"
                />
              </label>
            </div>
          </div>

          {}
          <div>
            <h4 className="font-mono text-[#737F91] uppercase tracking-wider mb-2">
              Accessibility
            </h4>
            <div className="space-y-2.5 p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Reduce Motion
                  </span>
                  <span className="text-[#737F91] text-[11px]">
                    Minimize 3D orb drift and avatar facial micro-transitions
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) =>
                    updateSettings({ reduceMotion: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#43D9BD]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[#F4F7FB] font-medium block">
                    Technical HUD Overlay
                  </span>
                  <span className="text-[#737F91] text-[11px]">
                    Show FPS, inference latency, and tracking stats in corner
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showDiagnosticsHUD}
                  onChange={(e) =>
                    updateSettings({ showDiagnosticsHUD: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#43D9BD]"
                />
              </label>
            </div>
          </div>
        </div>

        {}
        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#43D9BD] text-[#0B0D12] font-semibold text-xs hover:bg-[#34C7A8] transition cursor-pointer shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </motion.div>
    </div>
  )
}
