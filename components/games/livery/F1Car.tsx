'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { LiveryDesign, Finish } from '@/lib/games/livery'
import { makePatternTexture, makeNumberTexture, makeNameTexture } from './textures'

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

// A thin carbon strut between two points (suspension arms, wing pylons).
function Strut({ a, b, r = 0.02, mat }: { a: Vec; b: Vec; r?: number; mat: THREE.Material }) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = new THREE.Vector3().subVectors(vb, va)
  const len = dir.length() || 0.001
  const pos = new THREE.Vector3().addVectors(va, vb).multiplyScalar(0.5)
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return (
    <mesh position={pos} quaternion={quat} material={mat} castShadow>
      <cylinderGeometry args={[r, r, len, 8]} />
    </mesh>
  )
}

// One full corner of suspension (upper + lower wishbones, pushrod, track rod).
function suspensionSegments(wx: number, wy: number, wz: number): [Vec, Vec][] {
  const s = Math.sign(wx) || 1
  const upLo: Vec = [wx - s * 0.15, wy - 0.05, wz]
  const upHi: Vec = [wx - s * 0.15, wy + 0.12, wz]
  return [
    [upLo, [s * 0.3, wy - 0.08, wz - 0.28]],
    [upLo, [s * 0.3, wy - 0.08, wz + 0.28]],
    [upHi, [s * 0.28, wy + 0.2, wz - 0.24]],
    [upHi, [s * 0.28, wy + 0.2, wz + 0.24]],
    [upHi, [wx - s * 0.05, wy - 0.12, wz + 0.12]],
    [upLo, [s * 0.3, wy + 0.02, wz + 0.32]],
  ]
}

// A spoked wheel: rounded tyre (lathe), brake disc, rim ring, spokes, hub nut.
function Wheel({ pos, tireGeo, tireMat, rimMat, carbonMat, accentMat }: {
  pos: Vec; tireGeo: THREE.BufferGeometry
  tireMat: THREE.Material; rimMat: THREE.Material; carbonMat: THREE.Material; accentMat: THREE.Material
}) {
  const out = (Math.sign(pos[0]) || 1) * 0.17
  return (
    <group position={pos}>
      <mesh geometry={tireGeo} rotation={[0, 0, Math.PI / 2]} material={tireMat} castShadow />
      <group position={[out, 0, 0]}>
        {/* brake disc */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={carbonMat}>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 24]} />
        </mesh>
        {/* rim outer ring */}
        <mesh rotation={[0, Math.PI / 2, 0]} material={rimMat}>
          <torusGeometry args={[0.2, 0.03, 12, 28]} />
        </mesh>
        {/* spokes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} rotation={[(i * Math.PI) / 3, 0, 0]} material={rimMat}>
            <boxGeometry args={[0.04, 0.36, 0.025]} />
          </mesh>
        ))}
        {/* hub nut */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={accentMat}>
          <cylinderGeometry args={[0.055, 0.055, 0.1, 8]} />
        </mesh>
      </group>
    </group>
  )
}

function Decal({ map, position, rotation, scale }: {
  map: THREE.Texture; position: Vec; rotation?: Vec; scale: [number, number]
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={map} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-4} toneMapped={false} />
    </mesh>
  )
}

export function F1Car({ design }: { design: LiveryDesign }) {
  const { colors, finish, pattern } = design

  // ── Procedural textures ──
  const bodyTex = useMemo(() => makePatternTexture(pattern, colors.body, colors.accent), [pattern, colors.body, colors.accent])
  const numTex = useMemo(() => makeNumberTexture(design.number, colors.accent), [design.number, colors.accent])
  const nameTex = useMemo(() => makeNameTexture(design.name, colors.accent), [design.name, colors.accent])
  useEffect(() => () => { bodyTex?.dispose() }, [bodyTex])
  useEffect(() => () => { numTex.dispose() }, [numTex])
  useEffect(() => () => { nameTex.dispose() }, [nameTex])

  // ── Rounded tyre cross-section (lathe around Y, then laid on its side) ──
  const tireGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.2, -0.17), new THREE.Vector2(0.31, -0.17),
      new THREE.Vector2(0.35, -0.12), new THREE.Vector2(0.36, 0),
      new THREE.Vector2(0.35, 0.12), new THREE.Vector2(0.31, 0.17),
      new THREE.Vector2(0.2, 0.17),
    ]
    return new THREE.LatheGeometry(pts, 40)
  }, [])
  useEffect(() => () => tireGeo.dispose(), [tireGeo])

  // ── Shared materials (disposed on change) ──
  const mats = useMemo(() => {
    const f = physProps(finish)
    const paint = (hex: string) => new THREE.MeshPhysicalMaterial({ color: hex, ...f })
    const body = paint(colors.body)
    if (bodyTex) { body.map = bodyTex; body.color.set('#ffffff') } // texture already carries the base colour
    return {
      body,
      nose: paint(colors.nose),
      sidepods: paint(colors.sidepods),
      wings: paint(colors.wings),
      halo: new THREE.MeshPhysicalMaterial({ color: colors.halo, roughness: 0.35, metalness: 0.5, clearcoat: 0.6 }),
      rim: new THREE.MeshPhysicalMaterial({ color: colors.rims, roughness: 0.22, metalness: 0.95, clearcoat: 0.5 }),
      accent: new THREE.MeshPhysicalMaterial({ color: colors.accent, roughness: 0.3, metalness: 0.4, clearcoat: 0.6 }),
      carbon: new THREE.MeshPhysicalMaterial({ color: '#15161a', roughness: 0.45, metalness: 0.3, clearcoat: 0.4 }),
      tire: new THREE.MeshStandardMaterial({ color: '#15151b', roughness: 0.85, metalness: 0.0 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0a0a0c', roughness: 0.1, metalness: 0.2, clearcoat: 1 }),
      light: new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#ff1a1a', emissiveIntensity: 1.4 }),
    }
  }, [colors, finish, bodyTex])
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()) }, [mats])

  const wheels: Vec[] = [
    [0.95, 0.36, 1.55], [-0.95, 0.36, 1.55],
    [1.0, 0.36, -1.7], [-1.0, 0.36, -1.7],
  ]

  return (
    <group position={[0, -0.35, 0]} rotation={[0, -0.5, 0]}>
      {/* ── Floor + side edges + diffuser ── */}
      <RoundedBox args={[1.35, 0.07, 4.0]} radius={0.03} smoothness={3} position={[0, 0.12, -0.15]} material={mats.carbon} receiveShadow castShadow />
      {[0.68, -0.68].map((x, i) => (
        <RoundedBox key={i} args={[0.06, 0.14, 3.9]} radius={0.02} position={[x, 0.16, -0.15]} material={mats.carbon} castShadow />
      ))}
      <mesh position={[0, 0.26, -2.15]} rotation={[0.5, 0, 0]} material={mats.carbon} castShadow>
        <boxGeometry args={[1.1, 0.5, 0.4]} />
      </mesh>

      {/* ── Monocoque / cockpit tub ── */}
      <RoundedBox args={[0.74, 0.44, 2.3]} radius={0.16} smoothness={5} position={[0, 0.46, 0.15]} material={mats.body} castShadow />
      {/* cockpit opening */}
      <RoundedBox args={[0.4, 0.22, 0.62]} radius={0.08} position={[0, 0.62, -0.02]} material={mats.glass} />

      {/* ── Nose cone (tapered, oval, drooped) ── */}
      <group position={[0, 0.4, 1.55]} scale={[1.12, 0.82, 1]}>
        <mesh rotation={[-Math.PI / 2 + 0.06, 0, 0]} material={mats.nose} castShadow>
          <cylinderGeometry args={[0.1, 0.27, 1.5, 28]} />
        </mesh>
        <mesh position={[0, 0.04, 0.74]} material={mats.nose} castShadow>
          <sphereGeometry args={[0.1, 18, 18]} />
        </mesh>
      </group>

      {/* ── Engine cover (tapering to the rear) + airbox + shark fin ── */}
      <group position={[0, 0.5, -1.05]} scale={[1, 1, 1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.body} castShadow>
          <cylinderGeometry args={[0.1, 0.32, 1.7, 26]} />
        </mesh>
      </group>
      {/* airbox snorkel behind the driver, with a forward-facing intake mouth */}
      <mesh position={[0, 0.82, -0.34]} material={mats.body} castShadow>
        <sphereGeometry args={[0.16, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.83, -0.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.glass}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
      </mesh>
      {/* shark fin */}
      <mesh position={[0, 0.78, -1.45]} material={mats.body} castShadow>
        <boxGeometry args={[0.03, 0.42, 1.0]} />
      </mesh>

      {/* ── Sidepods (with inlet recess) ── */}
      {[0.56, -0.56].map((x, i) => (
        <group key={i}>
          <RoundedBox args={[0.46, 0.42, 1.5]} radius={0.14} smoothness={4} position={[x, 0.42, -0.05]} rotation={[0, 0, x > 0 ? -0.05 : 0.05]} material={mats.sidepods} castShadow />
          <RoundedBox args={[0.22, 0.24, 0.12]} radius={0.05} position={[x, 0.44, 0.7]} material={mats.glass} />
        </group>
      ))}
      {/* bargeboards */}
      {[0.5, -0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.34, 0.95]} rotation={[0, x > 0 ? 0.2 : -0.2, 0]} material={mats.carbon} castShadow>
          <boxGeometry args={[0.03, 0.28, 0.5]} />
        </mesh>
      ))}

      {/* ── Front wing (2 elements + endplates + pylons) ── */}
      <RoundedBox args={[1.8, 0.04, 0.42]} radius={0.02} position={[0, 0.13, 2.55]} rotation={[0.04, 0, 0]} material={mats.wings} castShadow />
      <RoundedBox args={[1.7, 0.035, 0.22]} radius={0.02} position={[0, 0.26, 2.62]} rotation={[0.28, 0, 0]} material={mats.wings} castShadow />
      {[0.88, -0.88].map((x, i) => (
        <RoundedBox key={i} args={[0.04, 0.3, 0.55]} radius={0.02} position={[x, 0.24, 2.55]} rotation={[0, x > 0 ? -0.06 : 0.06, 0]} material={mats.wings} castShadow />
      ))}
      <Strut a={[0.13, 0.2, 2.35]} b={[0.13, 0.42, 2.55]} r={0.018} mat={mats.wings} />
      <Strut a={[-0.13, 0.2, 2.35]} b={[-0.13, 0.42, 2.55]} r={0.018} mat={mats.wings} />

      {/* ── Rear wing (main + flap + endplates + swan-neck + beam + DRS light) ── */}
      <RoundedBox args={[1.25, 0.05, 0.34]} radius={0.02} position={[0, 1.08, -2.2]} rotation={[-0.22, 0, 0]} material={mats.wings} castShadow />
      <RoundedBox args={[1.25, 0.04, 0.2]} radius={0.02} position={[0, 0.92, -2.28]} rotation={[-0.1, 0, 0]} material={mats.wings} castShadow />
      {[0.62, -0.62].map((x, i) => (
        <RoundedBox key={i} args={[0.04, 0.6, 0.6]} radius={0.03} position={[x, 0.85, -2.22]} material={mats.wings} castShadow />
      ))}
      <Strut a={[0.1, 0.6, -1.95]} b={[0.1, 1.06, -2.18]} r={0.022} mat={mats.wings} />
      <Strut a={[-0.1, 0.6, -1.95]} b={[-0.1, 1.06, -2.18]} r={0.022} mat={mats.wings} />
      <RoundedBox args={[1.0, 0.04, 0.16]} radius={0.02} position={[0, 0.56, -2.12]} material={mats.wings} castShadow />
      <mesh position={[0, 0.66, -2.35]} material={mats.light}>
        <boxGeometry args={[0.08, 0.12, 0.04]} />
      </mesh>

      {/* ── Halo ──
          Hoop laid flat (rotation X = π/2) around the cockpit and raised above the
          driver, with a central front pillar + two rear mounts that meet the tub. */}
      <mesh position={[0, 0.76, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={mats.halo} castShadow>
        <torusGeometry args={[0.34, 0.05, 16, 40]} />
      </mesh>
      {/* central front V-pillar — angled forward of the helmet down to the nose deck */}
      <Strut a={[0, 0.75, 0.3]} b={[0, 0.48, 0.46]} r={0.035} mat={mats.halo} />
      {/* rear side mounts behind the driver (ring rear-sides ≈ x ±0.2, z -0.33) */}
      <Strut a={[0.2, 0.75, -0.33]} b={[0.16, 0.5, -0.46]} r={0.03} mat={mats.halo} />
      <Strut a={[-0.2, 0.75, -0.33]} b={[-0.16, 0.5, -0.46]} r={0.03} mat={mats.halo} />

      {/* ── Driver: helmet + visor (only the crown sits above the cockpit) ── */}
      <mesh position={[0, 0.6, -0.1]} material={mats.accent} castShadow>
        <sphereGeometry args={[0.115, 22, 22]} />
      </mesh>
      <mesh position={[0, 0.61, 0.0]} material={mats.glass}>
        <boxGeometry args={[0.15, 0.035, 0.04]} />
      </mesh>

      {/* ── Mirrors ── */}
      {[0.36, -0.36].map((x, i) => (
        <group key={i}>
          <Strut a={[x * 0.6, 0.58, 0.42]} b={[x, 0.6, 0.4]} r={0.012} mat={mats.carbon} />
          <RoundedBox args={[0.1, 0.07, 0.07]} radius={0.02} position={[x, 0.6, 0.4]} material={mats.body} castShadow />
        </group>
      ))}

      {/* ── Suspension ── */}
      {wheels.map((w, wi) =>
        suspensionSegments(w[0], w[1], w[2]).map((seg, si) => (
          <Strut key={`${wi}-${si}`} a={seg[0]} b={seg[1]} r={0.017} mat={mats.carbon} />
        )),
      )}

      {/* ── Wheels ── */}
      {wheels.map((w, i) => (
        <Wheel key={i} pos={w} tireGeo={tireGeo} tireMat={mats.tire} rimMat={mats.rim} carbonMat={mats.carbon} accentMat={mats.accent} />
      ))}

      {/* ── Decals: number on sidepods + nose, name on engine cover ── */}
      <Decal map={numTex} position={[0.81, 0.46, -0.05]} rotation={[0, Math.PI / 2, 0]} scale={[0.38, 0.38]} />
      <Decal map={numTex} position={[-0.81, 0.46, -0.05]} rotation={[0, -Math.PI / 2, 0]} scale={[0.38, 0.38]} />
      <Decal map={numTex} position={[0, 0.5, 1.05]} rotation={[-Math.PI / 2 + 0.06, 0, Math.PI / 2]} scale={[0.3, 0.3]} />
      <Decal map={nameTex} position={[0, 0.74, -0.95]} rotation={[-Math.PI / 2, 0, Math.PI]} scale={[0.42, 0.11]} />
    </group>
  )
}
