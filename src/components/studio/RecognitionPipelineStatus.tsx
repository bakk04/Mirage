"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  Camera,
  Hand,
  Cpu,
  Globe,
  Volume2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import {
  mobileNetClassifier,
  type PipelineProgressState,
  type PipelineStageState,
} from "@/services/mobileNetSignClassifier"
import { useMirageStore } from "@/store/mirageStore"

export default function RecognitionPipelineStatus() {
  const [pipeline, setPipeline] = useState<PipelineProgressState>({
    camera: "waiting",
    handTracking: "waiting",
    signRecognition: "waiting",
    translation: "waiting",
    voiceOutput: "waiting",
    currentStage: "idle",
    stageLabel: "Pipeline Standby",
  })

  const isSessionPaused = useMirageStore((s) => s.isSessionPaused)
  const isAudioPlaying = useMirageStore((s) => s.isAudioPlaying)
  const currentSignTokens = useMirageStore((s) => s.currentSignTokens)

  useEffect(() => {
    return mobileNetClassifier.subscribePipeline((p) => {
      setPipeline(p)
    })
  }, [])

  const stages = [
    {
      id: "camera",
      label: "Camera",
      subtext: "1280x720 RGB",
      icon: <Camera size={13} />,
      status: isSessionPaused ? "waiting" : pipeline.camera,
    },
    {
      id: "tracking",
      label: "Hand Tracking",
      subtext: "21 Keypoints",
      icon: <Hand size={13} />,
      status: isSessionPaused ? "waiting" : pipeline.handTracking,
    },
    {
      id: "inference",
      label: "MobileNetV2",
      subtext: "Sign Classifier",
      icon: <Cpu size={13} />,
      status: isSessionPaused ? "waiting" : pipeline.signRecognition,
    },
    {
      id: "translation",
      label: "Translation",
      subtext: "Gloss NLP",
      icon: <Globe size={13} />,
      status: currentSignTokens.length > 0 ? "completed" : pipeline.translation,
    },
    {
      id: "voice",
      label: "Voice Output",
      subtext: "Speech Synth",
      icon: <Volume2 size={13} />,
      status: isAudioPlaying ? "active" : pipeline.voiceOutput,
    },
  ]

  const getStatusBadge = (status: PipelineStageState) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#5EEAD4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4] animate-pulse" />
            Active
          </span>
        )
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399]">
            <CheckCircle2 size={10} />
            Ready
          </span>
        )
      case "failed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#FB7185]">
            <AlertTriangle size={10} />
            Error
          </span>
        )
      default: // waiting
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-white/30">
            <Clock size={9} />
            Standby
          </span>
        )
    }
  }

  return (
    <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-[#121620]/90 border border-white/[0.06] backdrop-blur-md">
      {/* Stages Row */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 sm:pb-0">
        {stages.map((st, idx) => {
          const isActive = st.status === "active"
          const isCompleted = st.status === "completed"

          return (
            <div key={st.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-[90px]">
              <div
                className={`flex-1 flex flex-col gap-1 p-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 shadow-[0_0_12px_rgba(94,234,212,0.15)]"
                    : isCompleted
                      ? "bg-white/[0.04] border border-white/10"
                      : "bg-white/[0.02] border border-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`${
                      isActive
                        ? "text-[#5EEAD4]"
                        : isCompleted
                          ? "text-[#34D399]"
                          : "text-white/40"
                    }`}
                  >
                    {st.icon}
                  </span>
                  {getStatusBadge(st.status as PipelineStageState)}
                </div>

                <div className="mt-0.5">
                  <p className="text-[11px] font-medium text-white/90 leading-tight">
                    {st.label}
                  </p>
                  <p className="text-[9px] font-mono text-white/40 leading-tight">
                    {st.subtext}
                  </p>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <ChevronRight size={12} className="text-white/20 shrink-0 hidden sm:block" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
