"use client"

// Idle breathing

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import * as THREE from "three"
import { vertexShader, fragmentShader } from "./shaders"
import type { MirageStateType } from "@/store/mirageStore"
import type { GazeValues } from "@/hooks/useMousePosition"

interface OrbMeshProps {
  state: MirageStateType
  amplitude: number
  gaze: GazeValues
}

function OrbMesh({ state, amplitude, gaze }: OrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

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
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    materialRef.current.uniforms.uAmplitude.value = amplitude
    materialRef.current.uniforms.uGaze.value.set(gaze.x.get(), gaze.y.get())
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

interface OrbWebGLProps {
  state: MirageStateType
  amplitude: number
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
      dpr={[1, 1.75]}
      frameloop="always"
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ width: size, height: size, background: "transparent" }}
      camera={{ position: [0, 0, 1], fov: 60 }}
    >
      <OrbMesh state={state} amplitude={amplitude} gaze={gaze} />
      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.8}
        />
      </EffectComposer>
    </Canvas>
  )
}
