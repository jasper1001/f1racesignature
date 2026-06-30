'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { LiveryDesign, Finish } from '@/lib/games/livery'
import { makePatternTexture, makeNumberTexture, makeNameTexture } from './textures'

type Vec = [number, number, number]

// Coordinate convention: +Z = front of car, -Z = rear, +Y = up, X = width.
// Modelled toward a modern ground-effect (2022+) F1 silhouette: long, low,
// big 18" low-profile wheels with aero covers, multi-element wings, downwash
// sidepods, floor edges, beam wing + diffuser.

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

// A flat aero blade between two points (suspension wishbones): a thin box whose
// chord lies horizontal and whose thin axis is vertical, like a real F1 arm.
function Blade({ a, b, w = 0.07, t = 0.02, mat }: { a: Vec; b: Vec; w?: number; t?: number; mat: THREE.Material }) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = new THREE.Vector3().subVectors(vb, va)
  const len = dir.length() || 0.001
  dir.normalize()
  const pos = new THREE.Vector3().addVectors(va, vb).multiplyScalar(0.5)
  // Pick a reference up that isn't parallel to the arm, then build an orthonormal
  // basis so the box's X (chord) is horizontal and Z (thickness) stays thin.
  const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
  const wide = new THREE.Vector3().crossVectors(up, dir).normalize()
  // Right-handed basis (X=wide, Y=dir, Z=thin) so the quaternion is a pure
  // rotation — wide×dir, not dir×wide, or the blade twists to point up.
  const thin = new THREE.Vector3().crossVectors(wide, dir).normalize()
  const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(wide, dir, thin))
  return (
    <mesh position={pos} quaternion={quat} material={mat} castShadow>
      <boxGeometry args={[w, len, t]} />
    </mesh>
  )
}

// Low-profile tyre cross-section (lathe around Y, then laid on its side in Wheel).
// R = tyre outer radius, halfW = half tread width, rimR = inner (rim) radius.
function makeTyre(R: number, halfW: number, rimR: number): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(rimR, -halfW),
    new THREE.Vector2(R - 0.05, -halfW),
    new THREE.Vector2(R, -halfW + 0.06),
    new THREE.Vector2(R, halfW - 0.06),
    new THREE.Vector2(R - 0.05, halfW),
    new THREE.Vector2(rimR, halfW),
  ]
  return new THREE.LatheGeometry(pts, 44)
}

// Modern F1 wheel: low-profile tyre + solid aero wheel cover (front gets an
// over-tyre winglet), inboard brake duct. Spokes are hidden behind the cover.
function Wheel({ pos, front, tireGeo, mats }: {
  pos: Vec; front: boolean; tireGeo: THREE.BufferGeometry
  mats: Record<string, THREE.Material>
}) {
  const s = Math.sign(pos[0]) || 1
  const out = s * (front ? 0.17 : 0.22)
  return (
    <group position={pos}>
      <mesh geometry={tireGeo} rotation={[0, 0, Math.PI / 2]} material={mats.tire} castShadow />
      {/* outboard aero wheel cover (gold disc) */}
      <mesh position={[out, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.rim} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 36]} />
      </mesh>
      {/* rim pinstripe + hub, sitting proud of the cover on the outboard face */}
      <mesh position={[out + s * 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.accent}>
        <torusGeometry args={[0.19, 0.014, 12, 40]} />
      </mesh>
      <mesh position={[out + s * 0.035, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.carbon}>
        <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
      </mesh>
      {/* inboard brake duct face */}
      <mesh position={[-out * 0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.carbon}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 24]} />
      </mesh>
    </group>
  )
}

// One corner of pushrod suspension: upper + lower wishbones (two legs each) and
// a track/pushrod, from the wheel hub inboard to the chassis.
function suspensionSegments(wx: number, wy: number, wz: number, front: boolean): [Vec, Vec][] {
  const s = Math.sign(wx) || 1
  const hubIn = wx - s * 0.16
  // Inboard mount: the slender nose up front, the gearbox casing at the rear —
  // both narrow, so the wishbones reach the centreline bodywork instead of air.
  const cx = s * (front ? 0.14 : 0.15)
  const dz = front ? 0.26 : 0.3
  return [
    // lower wishbone (V)
    [[hubIn, wy - 0.06, wz], [cx, wy - 0.1, wz - dz]],
    [[hubIn, wy - 0.06, wz], [cx, wy - 0.1, wz + dz]],
    // upper wishbone (V)
    [[hubIn, wy + 0.12, wz], [cx, wy + 0.16, wz - dz * 0.85]],
    [[hubIn, wy + 0.12, wz], [cx, wy + 0.16, wz + dz * 0.85]],
    // pushrod
    [[hubIn, wy - 0.04, wz], [cx, wy + 0.2, wz + (front ? 0.1 : -0.1)]],
  ]
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

  // ── Tyres (front narrower than rear, both low-profile big-rim) ──
  const tireFront = useMemo(() => makeTyre(0.42, 0.15, 0.26), [])
  const tireRear = useMemo(() => makeTyre(0.43, 0.2, 0.26), [])
  useEffect(() => () => { tireFront.dispose(); tireRear.dispose() }, [tireFront, tireRear])

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

  // Wheel centres: front narrower track, rear slightly wider; long wheelbase.
  const frontWheels: Vec[] = [[0.92, 0.42, 1.6], [-0.92, 0.42, 1.6]]
  const rearWheels: Vec[] = [[0.98, 0.43, -1.78], [-0.98, 0.43, -1.78]]

  return (
    <group position={[0, -0.42, 0]} rotation={[0, -0.5, 0]}>
      {/* ════════ FLOOR ════════ */}
      {/* main plank */}
      <RoundedBox args={[1.28, 0.06, 4.4]} radius={0.03} smoothness={3} position={[0, 0.14, -0.15]} material={mats.carbon} receiveShadow castShadow />
      {/* raised floor edges (2022 edge wings) */}
      {[0.66, -0.66].map((x, i) => (
        <RoundedBox key={i} args={[0.06, 0.1, 3.4]} radius={0.02} position={[x, 0.18, -0.1]} material={mats.carbon} castShadow />
      ))}
      {/* front floor fences */}
      {[0.5, -0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.16, 1.1]} rotation={[0, x > 0 ? 0.15 : -0.15, 0]} material={mats.carbon} castShadow>
          <boxGeometry args={[0.025, 0.16, 0.7]} />
        </mesh>
      ))}
      {/* diffuser — upswept rear floor section with vertical strakes */}
      <mesh position={[0, 0.24, -2.18]} rotation={[-0.5, 0, 0]} material={mats.carbon} castShadow>
        <boxGeometry args={[1.12, 0.42, 0.05]} />
      </mesh>
      {[-0.42, -0.14, 0.14, 0.42].map((x, i) => (
        <mesh key={i} position={[x, 0.26, -2.16]} rotation={[-0.5, 0, 0]} material={mats.carbon} castShadow>
          <boxGeometry args={[0.025, 0.4, 0.08]} />
        </mesh>
      ))}

      {/* ════════ MONOCOQUE / cockpit tub ════════ */}
      <RoundedBox args={[0.72, 0.4, 2.5]} radius={0.18} smoothness={5} position={[0, 0.44, 0.05]} material={mats.body} castShadow />
      {/* raised cockpit coaming */}
      <RoundedBox args={[0.6, 0.3, 1.2]} radius={0.14} smoothness={4} position={[0, 0.52, -0.25]} material={mats.body} castShadow />
      {/* cockpit opening (dark recess) */}
      <RoundedBox args={[0.36, 0.16, 0.66]} radius={0.07} position={[0, 0.66, -0.05]} material={mats.glass} />

      {/* ════════ NOSE — sharp tapered chisel sweeping down to the wing ════════ */}
      {/* flattened wedge (wider than tall) coming to a point at the front */}
      <group position={[0, 0.46, 1.55]} rotation={[0.05, 0, 0]} scale={[0.82, 0.62, 1]}>
        <mesh rotation={[-Math.PI / 2 + 0.16, 0, 0]} material={mats.nose} castShadow>
          <cylinderGeometry args={[0.44, 0.015, 2.15, 26]} />
        </mesh>
      </group>

      {/* ════════ FRONT WING — cascading elements sweeping up into flared endplates ════════ */}
      {/* central span: 4 stacked elements with rising chord */}
      <RoundedBox args={[1.5, 0.035, 0.52]} radius={0.02} position={[0, 0.1, 2.5]} rotation={[0.05, 0, 0]} material={mats.wings} castShadow />
      <RoundedBox args={[1.44, 0.03, 0.22]} radius={0.02} position={[0, 0.17, 2.62]} rotation={[0.3, 0, 0]} material={mats.wings} castShadow />
      <RoundedBox args={[1.38, 0.03, 0.17]} radius={0.02} position={[0, 0.25, 2.66]} rotation={[0.46, 0, 0]} material={mats.wings} castShadow />
      <RoundedBox args={[1.32, 0.03, 0.14]} radius={0.02} position={[0, 0.33, 2.69]} rotation={[0.58, 0, 0]} material={mats.wings} castShadow />
      {/* outboard sections rolling up toward the endplates */}
      {[0.82, -0.82].map((x, i) => {
        const s = x > 0 ? 1 : -1
        return (
          <group key={i}>
            <RoundedBox args={[0.36, 0.03, 0.5]} radius={0.02} position={[x, 0.16, 2.52]} rotation={[0.1, 0, s * -0.5]} material={mats.wings} castShadow />
            <RoundedBox args={[0.3, 0.03, 0.22]} radius={0.02} position={[x + s * 0.05, 0.29, 2.62]} rotation={[0.34, 0, s * -0.62]} material={mats.wings} castShadow />
          </group>
        )
      })}
      {/* endplates — tall, flared outward at the top */}
      {[0.94, -0.94].map((x, i) => {
        const s = x > 0 ? 1 : -1
        return (
          <RoundedBox key={i} args={[0.04, 0.48, 0.62]} radius={0.02} position={[x, 0.32, 2.55]} rotation={[0, s * -0.08, s * -0.22]} material={mats.wings} castShadow />
        )
      })}

      {/* ════════ SIDEPODS (high inlet, downwash ramp to rear) ════════ */}
      {[0.55, -0.55].map((x, i) => {
        const s = x > 0 ? 1 : -1
        return (
          <group key={i}>
            {/* inlet block */}
            <RoundedBox args={[0.5, 0.44, 0.62]} radius={0.12} smoothness={4} position={[x, 0.48, 0.62]} material={mats.sidepods} castShadow />
            {/* inlet mouth */}
            <RoundedBox args={[0.32, 0.3, 0.12]} radius={0.05} position={[x, 0.48, 0.95]} material={mats.glass} />
            {/* downwash body, tucking down + inward toward the rear */}
            <RoundedBox args={[0.48, 0.4, 1.5]} radius={0.16} smoothness={4} position={[x, 0.4, -0.35]} rotation={[0.12, 0, s * 0.12]} material={mats.sidepods} castShadow />
            {/* undercut */}
            <mesh position={[x + s * 0.18, 0.26, -0.4]} rotation={[0, 0, s * 0.5]} material={mats.carbon}>
              <boxGeometry args={[0.12, 0.16, 1.5]} />
            </mesh>
          </group>
        )
      })}

      {/* ════════ ENGINE COVER + AIRBOX + SHARK FIN ════════ */}
      {/* airbox (roof intake) — wedge with a dark mouth, not a sphere */}
      <RoundedBox args={[0.3, 0.28, 0.5]} radius={0.08} smoothness={4} position={[0, 0.74, -0.5]} rotation={[-0.12, 0, 0]} material={mats.body} castShadow />
      <mesh position={[0, 0.78, -0.28]} rotation={[1.35, 0, 0]} material={mats.glass}>
        <cylinderGeometry args={[0.1, 0.12, 0.06, 20]} />
      </mesh>
      {/* spine tapering to the rear crash structure */}
      <group position={[0, 0.5, -1.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.body} castShadow>
          <cylinderGeometry args={[0.08, 0.3, 1.6, 26]} />
        </mesh>
      </group>
      {/* shark fin */}
      <mesh position={[0, 0.72, -1.35]} material={mats.body} castShadow>
        <boxGeometry args={[0.025, 0.4, 1.1]} />
      </mesh>
      {/* rear gearbox / crash-structure casing — the rear suspension mounts to it */}
      <RoundedBox args={[0.3, 0.36, 0.8]} radius={0.06} smoothness={4} position={[0, 0.46, -1.72]} material={mats.carbon} castShadow />

      {/* ════════ HALO ════════ */}
      <mesh position={[0, 0.78, -0.1]} rotation={[Math.PI / 2, 0, 0]} material={mats.halo} castShadow>
        <torusGeometry args={[0.34, 0.05, 16, 40]} />
      </mesh>
      <Strut a={[0, 0.77, 0.26]} b={[0, 0.5, 0.42]} r={0.035} mat={mats.halo} />
      <Strut a={[0.2, 0.77, -0.38]} b={[0.16, 0.52, -0.5]} r={0.03} mat={mats.halo} />
      <Strut a={[-0.2, 0.77, -0.38]} b={[-0.16, 0.52, -0.5]} r={0.03} mat={mats.halo} />

      {/* ════════ MIRRORS ════════ */}
      {[0.4, -0.4].map((x, i) => (
        <group key={i}>
          <Strut a={[x * 0.55, 0.6, 0.45]} b={[x, 0.62, 0.42]} r={0.012} mat={mats.carbon} />
          <RoundedBox args={[0.1, 0.07, 0.06]} radius={0.02} position={[x, 0.62, 0.42]} material={mats.body} castShadow />
        </group>
      ))}

      {/* ════════ REAR WING (main + DRS flap + endplates + swan-neck + beam) ════════ */}
      <RoundedBox args={[1.08, 0.045, 0.34]} radius={0.02} position={[0, 1.02, -2.4]} rotation={[-0.24, 0, 0]} material={mats.wings} castShadow />
      <RoundedBox args={[1.08, 0.04, 0.2]} radius={0.02} position={[0, 0.86, -2.48]} rotation={[-0.08, 0, 0]} material={mats.wings} castShadow />
      {[0.54, -0.54].map((x, i) => (
        <RoundedBox key={i} args={[0.04, 0.58, 0.62]} radius={0.03} position={[x, 0.82, -2.42]} material={mats.wings} castShadow />
      ))}
      {/* swan-neck supports */}
      <Strut a={[0.1, 0.58, -2.0]} b={[0.1, 1.0, -2.36]} r={0.022} mat={mats.wings} />
      <Strut a={[-0.1, 0.58, -2.0]} b={[-0.1, 1.0, -2.36]} r={0.022} mat={mats.wings} />
      {/* beam wing */}
      <RoundedBox args={[0.95, 0.04, 0.16]} radius={0.02} position={[0, 0.56, -2.3]} material={mats.wings} castShadow />
      {/* rear crash structure + exhaust + rain light */}
      <mesh position={[0, 0.5, -2.0]} rotation={[Math.PI / 2, 0, 0]} material={mats.carbon} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 0.4, 16]} />
      </mesh>
      <mesh position={[0, 0.55, -2.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.carbon}>
        <cylinderGeometry args={[0.05, 0.06, 0.12, 16]} />
      </mesh>
      <mesh position={[0, 0.42, -2.18]} material={mats.light}>
        <boxGeometry args={[0.07, 0.1, 0.04]} />
      </mesh>

      {/* ════════ SUSPENSION ════════ */}
      {frontWheels.map((w, wi) =>
        suspensionSegments(w[0], w[1], w[2], true).map((seg, si) => (
          <Blade key={`f${wi}-${si}`} a={seg[0]} b={seg[1]} w={0.075} t={0.022} mat={mats.carbon} />
        )),
      )}
      {rearWheels.map((w, wi) =>
        suspensionSegments(w[0], w[1], w[2], false).map((seg, si) => (
          <Blade key={`r${wi}-${si}`} a={seg[0]} b={seg[1]} w={0.085} t={0.024} mat={mats.carbon} />
        )),
      )}

      {/* ════════ WHEELS ════════ */}
      {frontWheels.map((w, i) => (
        <Wheel key={`fw${i}`} pos={w} front tireGeo={tireFront} mats={mats} />
      ))}
      {rearWheels.map((w, i) => (
        <Wheel key={`rw${i}`} pos={w} front={false} tireGeo={tireRear} mats={mats} />
      ))}

      {/* ════════ DECALS: number on nose + sidepods, name on engine cover ════════ */}
      {/* number on the nose top (sits on the slimmer nose, clear of the cockpit) */}
      <Decal map={numTex} position={[0, 0.49, 1.82]} rotation={[-Math.PI / 2 + 0.18, 0, Math.PI / 2]} scale={[0.2, 0.2]} />
      {/* number on each sidepod outer face — proud of the bodywork so it never buries */}
      <Decal map={numTex} position={[0.82, 0.5, 0.55]} rotation={[0, Math.PI / 2, 0]} scale={[0.26, 0.26]} />
      <Decal map={numTex} position={[-0.82, 0.5, 0.55]} rotation={[0, -Math.PI / 2, 0]} scale={[0.26, 0.26]} />
      {/* name on the engine cover spine */}
      <Decal map={nameTex} position={[0, 0.71, -1.0]} rotation={[-Math.PI / 2, 0, Math.PI]} scale={[0.34, 0.085]} />
    </group>
  )
}
