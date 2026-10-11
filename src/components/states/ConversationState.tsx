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
        className="absolute inset-x-0 bottom-0 top-16 flex flex-col justify-end px-4 pb-[clamp(7rem,16vh,10rem)] pt-24 sm:px-8 lg:px-12"
        aria-live="polite"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
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
                    <div className="max-w-[min(88%,42rem)]">
                      {isNewest ? (
                        <div className="rounded-2xl rounded-bl-md border border-white/10 bg-[#11151A]/65 px-5 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-md">
                          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#5EEAD4]/75">
                            MIRAGE
                          </p>
                          <p className="text-[clamp(1.125rem,2.1vw,1.625rem)] font-light leading-[1.45] text-[#F4F5F7]">
                            <StreamingText text={msg.content} delay={0.1} />
                          </p>
                        </div>
                      ) : (
                        <p className="text-lg font-light leading-[1.45] text-white/30">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[min(78%,30rem)] rounded-2xl rounded-br-md border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
                        You
                      </p>
                      <p
                        className={`text-sm leading-6 tracking-[0.02em] ${
                          isNewest ? "text-[#F4F5F7]/80" : "text-[#8C95A3]/35"
                        }`}
                      >
                        {msg.content}
                      </p>
                    </div>
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
