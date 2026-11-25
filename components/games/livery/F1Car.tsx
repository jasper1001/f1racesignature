'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF, Decal } from '@react-three/drei'
import type { LiveryDesign, Finish, Pattern } from '@/lib/games/livery'
import { makePatternTexture, makeNumberTexture, makeNameTexture } from './textures'

// ── Model ───────────────────────────────────────────────────────────────────────
// "Formula 1 2022 Car" by luis.adrian.villagrana (Sketchfab, CC BY 4.0), prepared
// in Blender: scaled to real size (5.56 m), +Z = front, +Y = up, ground at y = 0,
// and the single livery shell cut into named paint-zone materials. Every mesh in
// the file is keyed by its material name (see MATERIAL_KEYS below).
// Self-hosted and uncompressed on purpose: the site CSP blocks the Draco /
// Meshopt WASM decoders, so the file must load with the plain GLTFLoader.
export const MODEL_URL = '/models/f1-2022.glb'

// Body-zone UVs were authored in Blender as a top/side projection in 0.8 m
// tiles, running rear → nose. The car is ~6.95 tiles long.
const CAR_LENGTH_TILES = 6.95

type Vec = [number, number, number]

// ── Finish → physically-based paint parameters ──────────────────────────────────
// MeshPhysicalMaterial + clearcoat reads as real automotive paint once the scene
// supplies an environment map (see Scene.tsx Lightformers).
function physProps(finish: Finish): THREE.MeshPhysicalMaterialParameters {
  switch (finish) {
    case 'matte': return { roughness: 0.62, metalness: 0.0, clearcoat: 0.25, clearcoatRoughness: 0.55, envMapIntensity: 0.55 }
    case 'metallic': return { roughness: 0.18, metalness: 1.0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 }
    case 'gloss': default: return { roughness: 0.28, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.0 }
  }
}

// How a pattern tiles over the body UVs (u = across, v = along the car).
// Tiling patterns repeat every 0.8 m; gradients/flames span the whole car.
function tilePattern(tex: THREE.Texture, pattern: Pattern) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  if (pattern === 'fade') tex.repeat.set(1, 1 / CAR_LENGTH_TILES)
  else if (pattern === 'flames') tex.repeat.set(1, 2 / CAR_LENGTH_TILES)
  else if (pattern === 'carbon') tex.repeat.set(2, 2)
  else tex.repeat.set(1, 1)
}

// Decal anchors in model space, measured by ray-casting the body in Blender.
// `rot` spins the artwork about the surface normal so it reads upright.
const DECALS = {
  nose: { position: [0, 0.675, 1.2] as Vec, rot: Math.PI / 2, size: 0.3 },
  sidepodL: { position: [0.756, 0.45, -0.2] as Vec, rot: 0, size: 0.34 },
  sidepodR: { position: [-0.756, 0.45, -0.2] as Vec, rot: 0, size: 0.34 },
  name: { position: [0, 0.946, -1.2] as Vec, rot: 0, size: [0.5, 0.125] as [number, number] },
}

interface Part { key: string; geometry: THREE.BufferGeometry }

export function F1Car({ design }: { design: LiveryDesign }) {
  const { colors, finish, pattern } = design
  const gltf = useGLTF(MODEL_URL, false)

  // One entry per primitive, keyed by the material name authored in Blender.
  const parts = useMemo<Part[]>(() => {
    const out: Part[] = []
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) out.push({ key: (m.material as THREE.Material).name, geometry: m.geometry })
    })
    return out
  }, [gltf])

  // ── Procedural textures ──
  const bodyTex = useMemo(() => {
    const t = makePatternTexture(pattern, colors.body, colors.accent)
    if (t) tilePattern(t, pattern)
    return t
  }, [pattern, colors.body, colors.accent])
  const numTex = useMemo(() => makeNumberTexture(design.number, colors.accent), [design.number, colors.accent])
  const nameTex = useMemo(() => makeNameTexture(design.name, colors.accent), [design.name, colors.accent])
  useEffect(() => () => { bodyTex?.dispose() }, [bodyTex])
  useEffect(() => () => { numTex.dispose() }, [numTex])
  useEffect(() => () => { nameTex.dispose() }, [nameTex])

  // ── Materials, keyed by the model's material names ──
  const mats = useMemo<Record<string, THREE.Material>>(() => {
    const f = physProps(finish)
    const paint = (hex: string) => new THREE.MeshPhysicalMaterial({ color: hex, ...f })
    const body = paint(colors.body)
    if (bodyTex) { body.map = bodyTex; body.color.set('#ffffff') } // texture already carries the base colour
    const carbon = new THREE.MeshPhysicalMaterial({ color: '#15161a', roughness: 0.45, metalness: 0.3, clearcoat: 0.4 })
    return {
      zone_body: body,
      zone_nose: paint(colors.nose),
      zone_sidepods: paint(colors.sidepods),
      zone_wings: paint(colors.wings),
      zone_halo: new THREE.MeshPhysicalMaterial({ color: colors.halo, roughness: 0.35, metalness: 0.5, clearcoat: 0.6 }),
      zone_rims: new THREE.MeshPhysicalMaterial({ color: colors.rims, roughness: 0.22, metalness: 0.95, clearcoat: 0.5 }),
      zone_accent: new THREE.MeshPhysicalMaterial({ color: colors.accent, roughness: 0.3, metalness: 0.4, clearcoat: 0.6 }),
      carbon,
      tyre: new THREE.MeshStandardMaterial({ color: '#17171c', roughness: 0.85, metalness: 0.0 }),
      tyre_band: new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: 0.7, metalness: 0.0 }),
      tyre_mark: new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.7, metalness: 0.0 }),
      // Driver race suit matches the car; gloves + steering wheel stay dark.
      driver_suit: new THREE.MeshStandardMaterial({ color: colors.body, roughness: 0.8, metalness: 0.0 }),
      driver_gloves: new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.8, metalness: 0.0 }),
      cockpit: new THREE.MeshStandardMaterial({ color: '#1c1d22', roughness: 0.5, metalness: 0.3 }),
      rear_light: new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#ff1a1a', emissiveIntensity: 1.4 }),
    }
  }, [colors, finish, bodyTex])
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()) }, [mats])

  const fallback = mats.carbon
  // Decal's default material is an unlit MeshBasicMaterial; depthTest is on so
  // the artwork never shows through the car from the far side.
  const decalProps = (map: THREE.Texture) => ({
    map, depthTest: true, polygonOffsetFactor: -10,
    'material-depthWrite': false, 'material-toneMapped': false,
  })

  return (
    <group position={[0, -0.42, 0]} rotation={[0, -0.5, 0]}>
      {parts.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={mats[key] ?? fallback} castShadow receiveShadow>
          {/* Decals are projected onto (and clipped to) their parent zone mesh. */}
          {key === 'zone_nose' && (
            <Decal position={DECALS.nose.position} rotation={DECALS.nose.rot} scale={[DECALS.nose.size, DECALS.nose.size, 0.3]} {...decalProps(numTex)} />
          )}
          {key === 'zone_sidepods' && (
            <>
              <Decal position={DECALS.sidepodL.position} rotation={DECALS.sidepodL.rot} scale={[DECALS.sidepodL.size, DECALS.sidepodL.size, 0.3]} {...decalProps(numTex)} />
              <Decal position={DECALS.sidepodR.position} rotation={DECALS.sidepodR.rot} scale={[DECALS.sidepodR.size, DECALS.sidepodR.size, 0.3]} {...decalProps(numTex)} />
            </>
          )}
          {key === 'zone_body' && (
            <Decal position={DECALS.name.position} rotation={DECALS.name.rot} scale={[...DECALS.name.size, 0.3]} {...decalProps(nameTex)} />
          )}
        </mesh>
      ))}
    </group>
  )
}

useGLTF.preload(MODEL_URL, false)
