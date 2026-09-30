"use client" /* Tooltip */ /* Turquoise ripple on press */ /* Text input expansion */ /* Dock pill */
import { useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useSpring,
} from "motion/react"
import { Mic, Camera, Type, Aperture, Sparkles } from "lucide-react"
import { useMirageStore, MirageStateType } from "@/store/mirageStore"

interface DockItem {
  id: string
  icon: React.ReactNode
  label: string
  action: MirageStateType | "text"
}

const ITEMS: DockItem[] = [
  {
    id: "mic",
    icon: <Mic size={18} strokeWidth={1.5} />,
    label: "Listen",
    action: "listening",
  },
  {
    id: "camera",
    icon: <Camera size={18} strokeWidth={1.5} />,
    label: "See",
    action: "camera",
  },
  {
    id: "text",
    icon: <Type size={18} strokeWidth={1.5} />,
    label: "Type",
    action: "text",
  },
  {
    id: "capture",
    icon: <Aperture size={18} strokeWidth={1.5} />,
    label: "Capture",
    action: "memory",
  },
  {
    id: "imagine",
    icon: <Sparkles size={18} strokeWidth={1.5} />,
    label: "Imagine",
    action: "imagine",
  },
]

function DockButton({
  item,
  mouseX,
  index,
}: {
  item: DockItem
  mouseX: ReturnType<typeof useMotionValue<number>>
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState(false)
  const [pressed, setPressed] = useState(false)
  const state = useMirageStore((s) => s.state)
  const setState = useMirageStore((s) => s.setState)

  const distance = useTransform(mouseX, (val) => {
    if (!ref.current) return 9999
    const rect = ref.current.getBoundingClientRect()
    return Math.abs(val - (rect.left + rect.width / 2))
  })

  const scale = useTransform(distance, [0, 40, 80], [1.35, 1.15, 1])
  const springScale = useSpring(scale, { stiffness: 300, damping: 25 })

  const magnetY = useTransform(distance, [0, 60], [-6, 0])
  const springY = useSpring(magnetY, { stiffness: 300, damping: 25 })

  const isActive = state === item.action

  const handleClick = () => {
    if (item.action === "text") return
    setState(item.action as MirageStateType)
    setPressed(true)
    setTimeout(() => setPressed(false), 300)
    if (navigator.vibrate) navigator.vibrate(10)
  }

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col items-center"
      style={{ scale: springScale, y: springY }}
    >
      {}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="absolute -top-10 px-3 py-1.5 rounded-lg glass text-xs tracking-wider whitespace-nowrap"
            style={{ color: "rgba(244,245,247,0.7)", fontWeight: 300 }}
            initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 4, filter: "blur(4px)" }}
            transition={{ duration: 0.2 }}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        aria-label={item.label}
        className="relative w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200"
        style={{
          background: isActive
            ? "rgba(94,234,212,0.12)"
            : "rgba(255,255,255,0.04)",
          border: isActive
            ? "1px solid rgba(94,234,212,0.4)"
            : "1px solid rgba(255,255,255,0.06)",
          color: isActive ? "#5EEAD4" : "rgba(140,149,163,0.8)",
          boxShadow: isActive
            ? "0 0 16px rgba(94,234,212,0.2), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        whileTap={{ scale: 0.93 }}
        onHoverStart={() => setTimeout(() => setTooltip(true), 200)}
        onHoverEnd={() => setTooltip(false)}
        onClick={handleClick}
        animate={pressed ? { scale: [0.93, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {item.icon}

        {}
        <AnimatePresence>
          {pressed && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "1.5px solid rgba(94,234,212,0.6)" }}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

export default function Dock() {
  const mouseX = useMotionValue(Infinity)
  const [textOpen, setTextOpen] = useState(false)
  const setState = useMirageStore((s) => s.setState)

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
      {}
      <AnimatePresence>
        {textOpen && (
          <motion.div
            className="glass rounded-full overflow-hidden flex items-center"
            initial={{ width: 0, opacity: 0, height: 40 }}
            animate={{ width: 280, opacity: 1, height: 40 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <input
              autoFocus
              className="flex-1 bg-transparent px-5 text-sm outline-none"
              style={{ color: "rgba(244,245,247,0.8)", fontWeight: 300 }}
              placeholder="Ask MIRAGE anything…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setState("conversation")
                  setTextOpen(false)
                }
                if (e.key === "Escape") setTextOpen(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <motion.div
        className="mirage-dock flex items-center gap-2 px-5 py-3 rounded-full glass mobile-safe-bottom"
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {ITEMS.map((item, i) => {
          if (item.action === "text") {
            return (
              <motion.div
                key={item.id}
                className="relative flex flex-col items-center"
                style={{ transformOrigin: "bottom center" }}
              >
                <motion.button
                  aria-label={item.label}
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: textOpen
                      ? "rgba(94,234,212,0.12)"
                      : "rgba(255,255,255,0.04)",
                    border: textOpen
                      ? "1px solid rgba(94,234,212,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color: textOpen ? "#5EEAD4" : "rgba(140,149,163,0.8)",
                  }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setTextOpen((v) => !v)}
                >
                  <Type size={18} strokeWidth={1.5} />
                </motion.button>
              </motion.div>
            )
          }
          return (
            <DockButton key={item.id} item={item} mouseX={mouseX} index={i} />
          )
        })}
      </motion.div>
    </div>
  )
}
