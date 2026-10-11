"use client"

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
  const [activeTab, setActiveTab] = useState<"metrics" | "gradcam" | "landmarks" | "logs">("metrics")

  // Simulated telemetry coordinates for key landmarks
  const landmarkTelemetry = [
    { name: "Wrist (0)", x: "0.502", y: "0.784", z: "0.000" },
    { name: "Thumb Tip (4)", x: "0.381", y: "0.612", z: "0.045" },
    { name: "Index Tip (8)", x: "0.456", y: "0.312", z: "0.012" },
    { name: "Middle Tip (12)", x: "0.518", y: "0.294", z: "0.008" },
    { name: "Ring Tip (16)", x: "0.578", y: "0.342", z: "0.015" },
    { name: "Pinky Tip (20)", x: "0.635", y: "0.428", z: "0.022" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl rounded-3xl bg-[#0F141C] border border-white/10 p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#5EEAD4]/10 text-[#5EEAD4]">
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="text-base font-medium text-white/95">
                Model Diagnostics & Telemetry
              </h3>
              <p className="text-xs text-white/50 font-mono">
                {diagnostics.modelName} · ConvNeXt V2 + Kinematics Pipeline
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 pb-2">
          {(
            [
              ["metrics", "Core Metrics"],
              ["gradcam", "Grad-CAM Heatmap"],
              ["landmarks", "Landmarks Telemetry"],
              ["logs", "Runtime Logs"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono tracking-wider transition ${
                activeTab === tab
                  ? "bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/40"
                  : "bg-white/5 text-white/50 hover:text-white/80 border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto mt-3 py-2 space-y-4 pr-1">
          {activeTab === "metrics" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[11px] font-mono text-white/40 uppercase">
                  FPS (Frames/sec)
                </span>
                <p className="text-2xl font-mono text-[#5EEAD4] mt-1">
                  {diagnostics.fps}
                </p>
                <span className="text-[10px] text-white/40">Target: 30 - 60 FPS</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[11px] font-mono text-white/40 uppercase">
                  Inference Latency
                </span>
                <p className="text-2xl font-mono text-[#22D3EE] mt-1">
                  {diagnostics.inferenceLatencyMs} ms
                </p>
                <span className="text-[10px] text-white/40">Client-side Metal/WebGL</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[11px] font-mono text-white/40 uppercase">
                  Confidence Score
                </span>
                <p className="text-2xl font-mono text-[#34D399] mt-1">
                  {Math.round(diagnostics.trackingConfidence * 100)}%
                </p>
                <span className="text-[10px] text-white/40">Neural kinematic threshold</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[11px] font-mono text-white/40 uppercase">
                  Hands In View
                </span>
                <p className="text-2xl font-mono text-white/90 mt-1">
                  {diagnostics.handsDetectedCount}
                </p>
                <span className="text-[10px] text-white/40">21 keypoints per hand</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[11px] font-mono text-white/40 uppercase">
                  Backend Bridge
                </span>
                <p className="text-sm font-mono text-[#5EEAD4] mt-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> FastAPI Standby
                </p>
                <span className="text-[10px] text-white/40">Port 8000 / WebSocket</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[11px] font-mono text-white/40 uppercase">
                  Render Hardware
                </span>
                <p className="text-sm font-mono text-white/80 mt-2">
                  WebGL 2.0 Metal
                </p>
                <span className="text-[10px] text-white/40">Hardware Accelerated</span>
              </div>
            </div>
          )}

          {activeTab === "gradcam" && (
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/50 border border-white/5">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-white/70 font-mono">
                  Attention Heatmap (Grad-CAM Layer 4 Activation)
                </span>
                <button
                  onClick={() => setGradcamEnabled(!gradcamEnabled)}
                  className="text-xs font-mono text-[#5EEAD4] hover:underline"
                >
                  {gradcamEnabled ? "Disable" : "Enable"}
                </button>
              </div>

              {/* Heatmap Graphic Representation */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center">
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 55%, rgba(94,234,212,0.8) 0%, rgba(34,211,238,0.5) 30%, rgba(251,146,60,0.4) 60%, transparent 80%)",
                    filter: "blur(22px)",
                  }}
                />
                <div className="relative z-10 text-center font-mono text-xs text-white/80">
                  <span className="px-3 py-1 rounded-full bg-black/60 border border-white/10">
                    High Attention Region: Palm Center & Fingertip Joints (Weight: 0.94)
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "landmarks" && (
            <div className="rounded-2xl bg-black/40 border border-white/5 overflow-hidden">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-white/5 text-white/50 border-b border-white/5">
                  <tr>
                    <th className="p-3">Landmark</th>
                    <th className="p-3">X (Norm)</th>
                    <th className="p-3">Y (Norm)</th>
                    <th className="p-3">Z (Depth)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {landmarkTelemetry.map((row) => (
                    <tr key={row.name}>
                      <td className="p-3 font-medium text-[#5EEAD4]">{row.name}</td>
                      <td className="p-3">{row.x}</td>
                      <td className="p-3">{row.y}</td>
                      <td className="p-3">{row.z}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="p-4 rounded-2xl bg-black/70 border border-white/5 font-mono text-[11px] text-white/70 space-y-2 h-52 overflow-y-auto">
              <p className="text-[#5EEAD4]">[SYSTEM] Initialized Mirage-SignKinematics-v3</p>
              <p className="text-white/50">[VIDEO] Video stream acquired: 1280x720 @ 30 FPS</p>
              <p className="text-white/50">[NEURAL] Hand detected: Right Hand (Confidence: 0.95)</p>
              <p className="text-[#22D3EE]">[TOKEN] Recognized sign: "HELLO" (0.98)</p>
              <p className="text-[#22D3EE]">[TOKEN] Recognized sign: "HELP" (0.94)</p>
              <p className="text-[#34D399]">[NLP] Synthesized sentence: "Hello, could you please help me?"</p>
              <p className="text-[#FB923C]">[AUDIO] Speech synthesis rendered in en-US</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/40 font-mono">
          <span>Inference Engine: Active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 transition"
          >
            Close Diagnostics
          </button>
        </div>
      </motion.div>
    </div>
  )
}
