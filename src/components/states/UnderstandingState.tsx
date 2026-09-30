"use client"

// The coffee cup is roughly at 60% x, 65% y of the image
/* Base camera image — slightly zoomed */ /* Focus-pull blur layer (everything except the cup) */ /* Vignette */ /* Scan sweep */ /* Turquoise contour around the cup */ /* Curved contour around cup (approximate ellipse) */ /* Pulsing anchor dot */ /* Connector line to label */ /* Soft beam from orb area toward cup */ /* Glass label */ /* Suggestion chips */

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import SuggestionChips from "../SuggestionChips"
import { useDominantColor } from "@/hooks/useDominantColor"

const CAMERA_IMAGE =
  "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1400&h=900&fit=crop&auto=format&q=80"
const CUP_X = 60
const CUP_Y = 58

function CountUp({
  target,
  duration = 700,
}: {
  target: number
  duration?: number
}) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setVal(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return <>{val}</>
}

export default function UnderstandingState() {
  const [chipsVisible, setChipsVisible] = useState(false)
  const [swept, setSwept] = useState(false)
  useDominantColor(CAMERA_IMAGE)

  useEffect(() => {
    setTimeout(() => setSwept(true), 100)
    setTimeout(() => setChipsVisible(true), 1200)
  }, [])

  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden">
      {}
      <motion.div
        className="absolute inset-0 bg-neutral-900"
        style={{
          backgroundImage: `url(${CAMERA_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        animate={{ scale: 1.03 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      {}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(8px)",
          WebkitMaskImage: `radial-gradient(ellipse 22% 18% at ${CUP_X}% ${CUP_Y}%, transparent 60%, black 100%)`,
          maskImage: `radial-gradient(ellipse 22% 18% at ${CUP_X}% ${CUP_Y}%, transparent 60%, black 100%)`,
        }}
      />

      {}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(8,10,13,0.65) 100%)",
        }}
      />

      {}
      {swept && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 10%, rgba(94,234,212,0.08) 50%, transparent 90%)",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        />
      )}

      {}
      <motion.svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="contour-glow">
            <feGaussianBlur stdDeviation="0.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {}
        <motion.ellipse
          cx={CUP_X}
          cy={CUP_Y}
          rx="8"
          ry="11"
          fill="none"
          stroke="#5EEAD4"
          strokeWidth="0.3"
          filter="url(#contour-glow)"
          strokeDasharray="60"
          strokeDashoffset="60"
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />

        {}
        <motion.circle
          cx={CUP_X + 5}
          cy={CUP_Y - 10}
          r="0.6"
          fill="#5EEAD4"
          animate={{ opacity: [1, 0.4, 1], r: [0.6, 0.9, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {}
        <motion.line
          x1={CUP_X + 5}
          y1={CUP_Y - 10}
          x2={CUP_X + 18}
          y2={CUP_Y - 20}
          stroke="rgba(94,234,212,0.4)"
          strokeWidth="0.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 1 }}
        />

        {}
        <motion.line
          x1="15"
          y1="85"
          x2={CUP_X - 5}
          y2={CUP_Y + 5}
          stroke="rgba(94,234,212,0.08)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0.2] }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />
      </motion.svg>

      {}
      <motion.div
        className="absolute glass rounded-xl px-4 py-2.5"
        style={{
          left: `${CUP_X + 21}%`,
          top: `${CUP_Y - 26}%`,
          boxShadow: "0 0 20px rgba(94,234,212,0.1)",
          border: "1px solid rgba(94,234,212,0.25)",
        }}
        initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          className="text-sm"
          style={{ color: "rgba(244,245,247,0.9)", fontWeight: 300 }}
        >
          Coffee cup
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: "rgba(94,234,212,0.7)", fontWeight: 200 }}
        >
          <CountUp target={92} duration={700} />%
        </p>
      </motion.div>

      {}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: chipsVisible ? 1 : 0, y: chipsVisible ? 0 : 12 }}
        transition={{ duration: 0.5 }}
      >
        <SuggestionChips visible={chipsVisible} />
      </motion.div>
    </div>
  )
}
