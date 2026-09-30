"use client" /* Blinking caret */ /* Camera background */ /* Gradient scrim */ /* Messages — floating, no bubbles */
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useMirageStore } from "@/store/mirageStore"

const CAMERA_IMAGE =
  "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1400&h=900&fit=crop&auto=format&q=80"

interface StreamingTextProps {
  text: string
  delay?: number
}

function StreamingText({ text, delay = 0 }: StreamingTextProps) {
  const words = text.split(" ")
  return (
    <span>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, filter: "blur(6px)", y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            delay: delay + i * 0.06,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
      {}
      <motion.span
        className="inline-block w-0.5 h-5 ml-1 rounded-full align-middle"
        style={{ background: "#5EEAD4" }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </span>
  )
}

export default function ConversationState() {
  const messages = useMirageStore((s) => s.messages)

  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden">
      {}
      <div
        className="absolute inset-0 bg-neutral-900"
        style={{
          backgroundImage: `url(${CAMERA_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.4)",
        }}
      />

      {}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(8,10,13,0.95) 0%, rgba(8,10,13,0.4) 50%, transparent 100%)",
        }}
      />

      {}
      <div
        className="absolute inset-0 flex flex-col justify-end pb-32 px-12"
        aria-live="polite"
      >
        <div className="flex flex-col gap-6">
          <AnimatePresence>
            {messages.map((msg, i) => {
              const isNewest = i === messages.length - 1
              const isMirage = msg.role === "mirage"

              return (
                <motion.div
                  key={msg.id}
                  className={`flex ${
                    isMirage ? "justify-start" : "justify-end"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: isNewest ? 1 : 0.3,
                    y: 0,
                    filter: isNewest ? "blur(0px)" : "blur(1px)",
                  }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isMirage ? (
                    <div className="max-w-lg">
                      {isNewest ? (
                        <p
                          style={{
                            fontSize: 26,
                            fontWeight: 300,
                            color: "rgba(244,245,247,0.95)",
                            lineHeight: 1.4,
                          }}
                        >
                          <StreamingText text={msg.content} delay={0.1} />
                        </p>
                      ) : (
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 300,
                            color: "rgba(244,245,247,0.3)",
                            lineHeight: 1.4,
                          }}
                        >
                          {msg.content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color: isNewest
                          ? "rgba(140,149,163,0.8)"
                          : "rgba(140,149,163,0.3)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {msg.content}
                    </p>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
