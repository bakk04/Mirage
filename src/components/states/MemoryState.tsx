"use client" /* Time */ /* Thumbnail */ /* Glass overlay */ /* Caption */ /* Dim background */ /* Timeline label */ /* Timeline connector line */ /* Traveling light dot */ /* Cards strip */
import { useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react"

const CAMERA_IMAGE =
  "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=260&fit=crop&auto=format&q=80"

const MEMORIES = [
  {
    id: 1,
    time: "10:04",
    caption: "Coffee cup",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=320&h=200&fit=crop&auto=format&q=80",
    offset: -4,
    scale: 1,
    blur: 0,
    opacity: 1,
  },
  {
    id: 2,
    time: "10:02",
    caption: "Open book",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=320&h=200&fit=crop&auto=format&q=80",
    offset: 8,
    scale: 0.88,
    blur: 1,
    opacity: 0.65,
  },
  {
    id: 3,
    time: "10:01",
    caption: "Person at desk",
    image:
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=320&h=200&fit=crop&auto=format&q=80",
    offset: -10,
    scale: 0.76,
    blur: 2,
    opacity: 0.4,
  },
]

function MemoryCard({
  mem,
  index,
  mouseX,
}: {
  mem: typeof MEMORIES[0]
  index: number
  mouseX: MotionValue<number>
}) {
  const [hovered, setHovered] = useState(false)
  const parallaxX = useTransform(
    mouseX,
    (value) => (value - 0.5) * -12 * (index + 1) * 0.3,
  )

  return (
    <motion.div
      className="flex-shrink-0 snap-center flex flex-col items-center gap-3 cursor-pointer"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: mem.opacity, x: 0 }}
      transition={{
        delay: index * 0.12,
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 20,
      }}
      style={{ x: parallaxX }}
      whileHover={{ scale: mem.scale * 1.04 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {}
      <p
        style={{
          fontSize: 11,
          fontWeight: 200,
          color: "rgba(140,149,163,0.6)",
          letterSpacing: "0.1em",
        }}
      >
        {mem.time}
      </p>

      {}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: 200 * mem.scale,
          height: 128 * mem.scale,
          filter: `blur(${hovered ? 0 : mem.blur}px)`,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: hovered
            ? "0 0 0 1px rgba(94,234,212,0.3), 0 16px 40px rgba(0,0,0,0.5)"
            : "0 8px 24px rgba(0,0,0,0.4)",
          transition: "filter 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div
          className="absolute inset-0 bg-neutral-800"
          style={{
            backgroundImage: `url(${mem.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {}
        <div
          className="absolute inset-0"
          style={{
            background: `rgba(8,10,13,${0.1 + (1 - mem.opacity) * 0.4})`,
          }}
        />
      </motion.div>

      {}
      <p
        style={{
          fontSize: 12,
          fontWeight: 300,
          color: `rgba(244,245,247,${mem.opacity * 0.8})`,
          letterSpacing: "0.06em",
        }}
      >
        {mem.caption}
      </p>
    </motion.div>
  )
}

export default function MemoryState() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0.5)

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      onMouseMove={(e) => mouseX.set(e.clientX / window.innerWidth)}
    >
      {}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(8,10,13,0.7)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />

      {}
      <motion.p
        className="absolute top-32 tracking-widest"
        style={{
          fontSize: 11,
          fontWeight: 200,
          color: "rgba(94,234,212,0.5)",
          letterSpacing: "0.2em",
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        MEMORY
      </motion.p>

      {}
      <motion.div
        className="absolute overflow-hidden"
        style={{
          height: 1,
          width: "70%",
          background: "rgba(94,234,212,0.1)",
          top: "50%",
          left: "15%",
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {}
        <motion.div
          className="absolute top-0 h-full w-8 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(94,234,212,0.6), transparent)",
          }}
          animate={{ x: ["-100%", "2000%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {}
      <div
        ref={scrollRef}
        className="relative z-10 flex items-center gap-10 overflow-x-auto snap-x snap-mandatory py-4 px-16 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {MEMORIES.map((mem, i) => (
          <MemoryCard key={mem.id} mem={mem} index={i} mouseX={mouseX} />
        ))}
      </div>
    </div>
  )
}
