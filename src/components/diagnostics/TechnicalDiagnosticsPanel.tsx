"use client"

// Landmark telemetry sample
/* Header */ /* Tab Switcher */ /* Content Area */ /* Footer */

import { useState } from "react"
import { motion } from "motion/react"
import {
  Activity,
  Cpu,
  Wifi,
  Eye,
  X,
  Layers,
  Terminal,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from "lucide-react"
import { useMirageStore } from "@/store/mirageStore"

interface TechnicalDiagnosticsPanelProps {
  onClose: () => void
}

export default function TechnicalDiagnosticsPanel({
  onClose,
}: TechnicalDiagnosticsPanelProps) {
  const diagnostics = useMirageStore((s) => s.diagnostics)
  const settings = useMirageStore((s) => s.settings)
  const updateSettings = useMirageStore((s) => s.updateSettings)

  const [gradcamEnabled, setGradcamEnabled] = useState(true)
  const [activeTab, setActiveTab] =
    useState<"metrics" | "gradcam" | "landmarks" | "logs">("metrics")
  const landmarkTelemetry = [
    { name: "Wrist (0)", x: "0.502", y: "0.784", z: "0.000" },
    { name: "Thumb Tip (4)", x: "0.381", y: "0.612", z: "0.045" },
    { name: "Index Tip (8)", x: "0.456", y: "0.312", z: "0.012" },
    { name: "Middle Tip (12)", x: "0.518", y: "0.294", z: "0.008" },
    { name: "Ring Tip (16)", x: "0.578", y: "0.342", z: "0.015" },
    { name: "Pinky Tip (20)", x: "0.635", y: "0.428", z: "0.022" },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostics-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-2xl rounded-2xl bg-[#191F2B]/95 border border-white/[0.12] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh] overflow-hidden apple-specular-edge"
      >
        {}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#43D9BD]/12 text-[#43D9BD] border border-[#43D9BD]/25">
              <Cpu size={17} />
            </div>
            <div>
              <h3
                id="diagnostics-modal-title"
                className="text-sm font-semibold text-[#F4F7FB]"
              >
                Model Diagnostics & Telemetry
              </h3>
              <p className="text-xs text-[#A1ACBC] font-mono">
                ArSL Pipeline · MobileNetV2 & MediaPipe Runtime Monitor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#A1ACBC] hover:text-[#F4F7FB] transition cursor-pointer"
            aria-label="Close diagnostics"
          >
            <X size={17} />
          </button>
        </div>

        {}
        <div className="flex items-center gap-1.5 mt-3.5 pb-1">
          {([
            ["metrics", "Core Metrics"],
            ["gradcam", "Grad-CAM Heatmap"],
            ["landmarks", "Landmarks Telemetry"],
            ["logs", "Runtime Logs"],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                activeTab === tab
                  ? "bg-[#43D9BD]/15 text-[#43D9BD] border border-[#43D9BD]/35 font-medium"
                  : "bg-white/[0.04] text-[#A1ACBC] hover:text-[#F4F7FB] border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {}
        <div className="flex-1 overflow-y-auto mt-2.5 py-1 space-y-3 pr-1">
          {activeTab === "metrics" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  FPS (Frames/sec)
                </span>
                <p className="text-2xl font-mono text-[#43D9BD] mt-1 font-semibold">
                  {diagnostics.fps}
                </p>
                <span className="text-[10px] text-[#737F91]">
                  Target: 30 - 60 FPS
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  Inference Latency
                </span>
                <p className="text-2xl font-mono text-[#45B9F5] mt-1 font-semibold">
                  {diagnostics.inferenceLatencyMs} ms
                </p>
                <span className="text-[10px] text-[#737F91]">
                  Client-side Metal/WebGL
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  ArSL CNN Model
                </span>
                <p className={`text-xs font-mono mt-2 font-medium ${
                  diagnostics.mobileNetStatus === "ready"
                    ? "text-[#43D9BD]"
                    : diagnostics.mobileNetStatus === "error"
                      ? "text-rose-400"
                      : "text-[#F2AE75]"
                }`}>
                  {diagnostics.mobileNetStatusLabel || "Ready"}
                </p>
                <span className="text-[10px] text-[#737F91]">
                  Arabic Sign Language
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  MediaPipe Commands
                </span>
                <p className={`text-xs font-mono mt-2 font-medium ${
                  diagnostics.mediaPipeStatus === "ready"
                    ? "text-[#43D9BD]"
                    : diagnostics.mediaPipeStatus === "error"
                      ? "text-rose-400"
                      : "text-[#F2AE75]"
                }`}>
                  {diagnostics.mediaPipeStatusLabel || "Ready"}
                </p>
                <span className="text-[10px] text-[#737F91]">
                  Gesture Control
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  Confidence Score
                </span>
                <p className="text-2xl font-mono text-[#34D399] mt-1 font-semibold">
                  {Math.round(diagnostics.trackingConfidence * 100)}%
                </p>
                <span className="text-[10px] text-[#737F91]">
                  Neural kinematic threshold
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  Hands In View
                </span>
                <p className="text-2xl font-mono text-[#F4F7FB] mt-1 font-semibold">
                  {diagnostics.handsDetectedCount}
                </p>
                <span className="text-[10px] text-[#737F91]">
                  21 keypoints per hand
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  Backend Bridge
                </span>
                <p className="text-xs font-mono text-[#43D9BD] mt-2 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={13} /> FastAPI Standby
                </p>
                <span className="text-[10px] text-[#737F91]">
                  Port 8000 / WebSocket
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#737F91] uppercase">
                  Render Hardware
                </span>
                <p className="text-xs font-mono text-[#F4F7FB] mt-2 font-medium">
                  WebGL 2.0 Metal
                </p>
                <span className="text-[10px] text-[#737F91]">
                  Hardware Accelerated
                </span>
              </div>
            </div>
          )}

          {activeTab === "gradcam" && (
            <div className="flex flex-col items-center gap-2.5 p-3.5 rounded-xl bg-[#0B0D12]/70 border border-white/[0.08]">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-[#A1ACBC] font-mono">
                  Attention Heatmap (Grad-CAM Layer 4 Activation)
                </span>
                <button
                  onClick={() => setGradcamEnabled(!gradcamEnabled)}
                  className="text-xs font-mono text-[#43D9BD] hover:underline"
                >
                  {gradcamEnabled ? "Disable" : "Enable"}
                </button>
              </div>

              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 55%, rgba(67,217,189,0.7) 0%, rgba(69,185,245,0.4) 30%, rgba(242,174,117,0.3) 60%, transparent 80%)",
                    filter: "blur(20px)",
                  }}
                />
                <div className="relative z-10 text-center font-mono text-xs text-white/90">
                  <span className="px-3 py-1 rounded-full bg-black/60 border border-white/10">
                    High Attention Region: Palm Center & Fingertip Joints
                    (Weight: 0.94)
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "landmarks" && (
            <div className="rounded-xl bg-[#0B0D12]/70 border border-white/[0.08] overflow-hidden">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-white/[0.04] text-[#737F91] border-b border-white/[0.06]">
                  <tr>
                    <th className="p-2.5">Landmark</th>
                    <th className="p-2.5">X (Norm)</th>
                    <th className="p-2.5">Y (Norm)</th>
                    <th className="p-2.5">Z (Depth)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-[#F4F7FB]">
                  {landmarkTelemetry.map((row) => (
                    <tr key={row.name}>
                      <td className="p-2.5 font-medium text-[#43D9BD]">
                        {row.name}
                      </td>
                      <td className="p-2.5">{row.x}</td>
                      <td className="p-2.5">{row.y}</td>
                      <td className="p-2.5">{row.z}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="p-3.5 rounded-xl bg-[#0B0D12]/80 border border-white/[0.08] font-mono text-[11px] text-[#A1ACBC] space-y-1.5 h-48 overflow-y-auto">
              <p className="text-[#43D9BD]">
                [SYSTEM] Initialized Mirage-SignKinematics-v3
              </p>
              <p className="text-[#737F91]">
                [VIDEO] Video stream acquired: 1280x720 @ 30 FPS
              </p>
              <p className="text-[#737F91]">
                [NEURAL] Hand detected: Right Hand (Confidence: 0.95)
              </p>
              <p className="text-[#45B9F5]">
                [TOKEN] Recognized sign: "HELLO" (0.98)
              </p>
              <p className="text-[#45B9F5]">
                [TOKEN] Recognized sign: "HELP" (0.94)
              </p>
              <p className="text-[#34D399]">
                [NLP] Synthesized sentence: "Hello, could you please help me?"
              </p>
              <p className="text-[#F2AE75]">
                [AUDIO] Speech synthesis rendered in ar-SA
              </p>
            </div>
          )}
        </div>

        {}
        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#737F91] font-mono">
          <span>Inference Engine: Active</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-[#F4F7FB] transition cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </motion.div>
    </div>
  )
}
