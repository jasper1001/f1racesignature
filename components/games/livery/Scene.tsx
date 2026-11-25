'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Suspense, useEffect, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { LiveryDesign } from '@/lib/games/livery'
import { F1Car } from './F1Car'

// Registers a capture() on the parent ref so the toolbar can export a PNG.
// preserveDrawingBuffer (set on the Canvas gl) keeps the framebuffer readable.
function CaptureBridge({ captureRef }: { captureRef: MutableRefObject<(() => string) | null> }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    captureRef.current = () => gl.domElement.toDataURL('image/png')
    return () => { captureRef.current = null }
  }, [gl, captureRef])
  return null
}

// Photo-studio cyclorama: a soft vertical gradient set as the scene background,
// so it is part of the rendered frame (PNG export + garage thumbnails included).
function StudioBackdrop() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 512
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#f6f3ec')
    g.addColorStop(0.55, '#e8e2d5')
    g.addColorStop(1, '#d6cebd')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 4, 512)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    scene.background = tex
    return () => { scene.background = null; tex.dispose() }
  }, [scene])
  return null
}

// Keeps the whole car in frame for any stage shape: a wide desktop studio sits
// close, a tall phone viewport backs the camera off. Runs on resize only, so it
// never fights the user's own orbit / zoom in between.
const ORBIT_TARGET = new THREE.Vector3(0, 0.1, 0)
function AutoFrame() {
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  useEffect(() => {
    if (!width || !height) return
    const aspect = width / height
    const dist = THREE.MathUtils.clamp(10 / Math.min(aspect, 1.8), 6.4, 15)
    const dir = camera.position.clone().sub(ORBIT_TARGET).normalize()
    camera.position.copy(ORBIT_TARGET).addScaledVector(dir, dist)
    camera.lookAt(ORBIT_TARGET)
  }, [camera, width, height])
  return null
}

export interface SceneProps {
  design: LiveryDesign
  autoRotate: boolean
  captureRef: MutableRefObject<(() => string) | null>
}

export default function Scene({ design, autoRotate, captureRef }: SceneProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: [4.6, 2.1, 5.6], fov: 32 }}
    >
      <CaptureBridge captureRef={captureRef} />
      <StudioBackdrop />
      <AutoFrame />

      {/* Key + fill lighting */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#8c856f', 0.5]} />
      <directionalLight
        position={[5, 9, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#cfd6ff" />

      {/* Studio environment map — drives the clearcoat reflections.
          Built entirely from in-scene Lightformers (no external HDR / CDN, CSP-safe). */}
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={['#15151b']} />
        <Lightformer intensity={2.4} position={[0, 5, 1]} scale={[10, 6, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.2} position={[0, 1, 6]} scale={[8, 4, 1]} color="#fff6e8" />
        <Lightformer intensity={1.4} position={[-6, 2, 1]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} color="#cfe0ff" />
        <Lightformer intensity={1.4} position={[6, 2, 1]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} color="#fff0d6" />
        <Lightformer intensity={1.0} position={[0, 2, -6]} scale={[8, 5, 1]} rotation-y={Math.PI} />
      </Environment>

      {/* The car is a self-hosted GLB; suspend until it has loaded. */}
      <Suspense fallback={null}>
        <F1Car design={design} />
      </Suspense>

      <ContactShadows position={[0, -0.4, 0]} opacity={0.5} scale={9} blur={2.6} far={4} resolution={1024} color="#332f22" />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={16}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.02}
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
        target={ORBIT_TARGET}
      />
    </Canvas>
  )
}
