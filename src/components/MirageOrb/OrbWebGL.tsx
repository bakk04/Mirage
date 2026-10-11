"use client"

// Idle breathing

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { MotionValue } from "motion/react"
import { vertexShader, fragmentShader } from "./shaders"
import type { MirageStateType } from "@/store/mirageStore"
import type { GazeValues } from "@/hooks/useMousePosition"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface OrbMeshProps {
  state: MirageStateType
  amplitude: number | MotionValue<number>
  gaze: GazeValues
}

function OrbMesh({ state, amplitude, gaze }: OrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const reduced = useReducedMotion()

  const stateIndex = useMemo(() => {
    const map: Record<MirageStateType, number> = {
      idle: 0,
      listening: 1,
      camera: 2,
      understanding: 3,
      conversation: 3,
      speaking: 2,
      memory: 0,
      imagine: 4,
      studio: 0,
    }

    function CanvasLifecycle() {
      const { gl } = useThree()
      useEffect(() => {
        const canvas = gl.domElement
        const onLost = (event: Event) => event.preventDefault()
        const onRestored = () => gl.setClearColor(0x000000, 0)
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)
        return () => {
          canvas.removeEventListener("webglcontextlost", onLost)
          canvas.removeEventListener("webglcontextrestored", onRestored)
        }
      }, [gl])
      return null
    }
    return map[state]
  }, [state])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0 },
      uGaze: { value: new THREE.Vector2(0, 0) },
      uState: { value: 0 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uTime.value = reduced
      ? 0
      : clock.getElapsedTime()
    materialRef.current.uniforms.uAmplitude.value =
      typeof amplitude === "number" ? amplitude : amplitude.get()
    materialRef.current.uniforms.uState.value = stateIndex
    if (meshRef.current && state === "idle") {
      const t = clock.getElapsedTime()
      const breathe = 1 + Math.sin(t * (Math.PI / 2)) * 0.03
      meshRef.current.scale.setScalar(breathe)
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1)
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function CanvasLifecycle() {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    const onLost = (event: Event) => event.preventDefault()
    const onRestored = () => gl.setClearColor(0x000000, 0)
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
    }
  }, [gl])
  return null
}

interface OrbWebGLProps {
  state: MirageStateType
  amplitude: number | MotionValue<number>
  gaze: GazeValues
  size: number
}

export default function OrbWebGL({
  state,
  amplitude,
  gaze,
  size,
}: OrbWebGLProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="always"
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
      camera={{ position: [0, 0, 1], fov: 60 }}
    >
      <CanvasLifecycle />
      <OrbMesh state={state} amplitude={amplitude} gaze={gaze} />
    </Canvas>
  )
}
