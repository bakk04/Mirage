"use client"

// Painterly / artistic coffee scene with warm orange light
/* Main dreamy image */ /* Warm orange/turquoise color grade overlay */ /* Dreamy bloom vignette */ /* Floating glass surface */ /* Glowing border */ /* "Imagine this." text */ /* Particles multiplied */ /* Back to reality */ /* Radial light sweep from orb */

import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { useMirageStore } from "@/store/mirageStore"
const IMAGINE_IMAGE =
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1400&h=900&fit=crop&auto=format&q=80"

export default function ImagineState() {
  const setState = useMirageStore((s) => s.setState)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const imageX = useSpring(
    useTransform(mouseX, (value) => value * -14),
    { stiffness: 80, damping: 20 },
  )
  const imageY = useSpring(
    useTransform(mouseY, (value) => value * -14),
    { stiffness: 80, damping: 20 },
  )

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mouseX.set((e.clientX - r.left) / r.width - 0.5)
        mouseY.set((e.clientY - r.top) / r.height - 0.5)
      }}
      initial={{ opacity: 0, filter: "blur(12px) saturate(50%)" }}
      animate={{ opacity: 1, filter: "blur(0px) saturate(130%)" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {}
      <motion.div
        className="absolute inset-0 bg-neutral-900"
        style={{
          backgroundImage: `url(${IMAGINE_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          x: imageX,
          y: imageY,
        }}
        animate={{
          scale: 1.05,
        }}
      />

      {}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(251,146,60,0.18) 0%, rgba(94,234,212,0.12) 60%, rgba(8,10,13,0.5) 100%)",
          mixBlendMode: "overlay",
        }}
      />

      {}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(251,146,60,0.08) 60%, rgba(8,10,13,0.7) 100%)",
        }}
      />

      {}
      <motion.div
        className="absolute rounded-3xl overflow-hidden"
        style={{
          width: "55%",
          aspectRatio: "16/10",
          top: "12%",
          left: "50%",
          x: "-50%",
          border: "1px solid rgba(251,146,60,0.25)",
          boxShadow:
            "0 0 60px rgba(251,146,60,0.15), 0 40px 100px rgba(0,0,0,0.5)",
        }}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="w-full h-full bg-neutral-900"
          style={{
            backgroundImage: `url(${IMAGINE_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.85) saturate(130%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(251,146,60,0.2) 0%, rgba(94,234,212,0.1) 100%)",
          }}
        />
        {}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            border: "1px solid rgba(251,146,60,0.3)",
            boxShadow: "inset 0 0 40px rgba(251,146,60,0.05)",
          }}
        />
      </motion.div>

      {}
      <motion.div
        className="absolute bottom-40 left-0 right-0 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <p
          style={{
            fontSize: 22,
            fontWeight: 200,
            color: "rgba(244,245,247,0.8)",
            letterSpacing: "0.08em",
          }}
        >
          Imagine this.
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 200,
            color: "rgba(251,146,60,0.6)",
            letterSpacing: "0.15em",
          }}
        >
          A world as you dream it.
        </p>
      </motion.div>

      {}
      {Array.from({ length: 40 }).map((_, i) => {
        const startX = Math.random() * 100
        const startY = 80 + Math.random() * 20
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              left: `${startX}%`,
              top: `${startY}%`,
              background: i % 3 === 0 ? "#FB923C" : "#5EEAD4",
              opacity: 0,
            }}
            animate={{
              y: [0, -(200 + Math.random() * 200)],
              x: [(Math.random() - 0.5) * 60],
              opacity: [0, 0.4 + Math.random() * 0.3, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeOut",
            }}
          />
        )
      })}

      {}
      <motion.button
        className="absolute bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full glass text-xs tracking-widest"
        style={{
          color: "rgba(140,149,163,0.6)",
          fontWeight: 300,
          letterSpacing: "0.1em",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        whileHover={{
          color: "rgba(244,245,247,0.8)",
          borderColor: "rgba(255,255,255,0.12)",
        }}
        onClick={() => setState("camera")}
      >
        Back to reality
      </motion.button>

      {}
      <motion.div
        className="absolute"
        style={{
          bottom: "10%",
          left: "8%",
          width: "84%",
          height: "84%",
          background:
            "radial-gradient(circle at 10% 90%, rgba(251,146,60,0.12) 0%, transparent 60%)",
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  )
}
