"use client"

// Unsplash: person at modern desk with coffee cup, natural light
/* Background image */ /* Handheld drift animation */ /* Cinematic vignette */ /* Film grain */ /* Scan sweep */ /* Corner indicator */

import { useEffect, useState } from "react"
import { motion } from "motion/react"
const CAMERA_IMAGE =
  "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1400&h=900&fit=crop&auto=format&q=80"

export default function CameraState() {
  const [swept, setSwept] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSwept(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden"
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(100% at 50% 50%)" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {}
      <div
        className="absolute inset-0 bg-neutral-900"
        style={{
          backgroundImage: `url(${CAMERA_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: [0, 3, -3, 2, -2, 0],
          y: [0, -3, 2, -1, 3, 0],
          scale: [1.02, 1.03, 1.02, 1.03, 1.02],
        }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />

      {}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(8,10,13,0.7) 100%)",
        }}
      />

      {}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px",
        }}
      />

      {}
      {swept && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 10%, rgba(94,234,212,0.08) 50%, transparent 90%)",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      )}

      {}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: "#5EEAD4" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span
          className="text-xs tracking-widest"
          style={{
            color: "rgba(244,245,247,0.5)",
            fontWeight: 200,
            letterSpacing: "0.15em",
          }}
        >
          LIVE
        </span>
      </div>
    </motion.div>
  )
}
