import * as THREE from 'three'
import type { Pattern } from '@/lib/games/livery'

// ── Procedural CanvasTextures ───────────────────────────────────────────────────
// Everything is generated on a 2D <canvas> at runtime so the project ships no
// image assets and never touches an external CDN (the site CSP blocks them).
// All patterns are deterministic (no Math.random) so they don't flicker when the
// texture is regenerated on a colour change.

const SIZE = 512

function newCanvas(size = SIZE): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return { c, ctx: c.getContext('2d')! }
}

// Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. Returns an rgb() string.
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const clamp = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)))
  return `rgb(${clamp((n >> 16) & 255)},${clamp((n >> 8) & 255)},${clamp(n & 255)})`
}

// Tiny deterministic PRNG (mulberry32) so "organic" patterns are stable.
function rng(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function regularPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number, rot = 0) {
  ctx.beginPath()
  for (let i = 0; i <= sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

/** Body pattern overlaid on the base colour. Returns null for a solid finish. */
export function makePatternTexture(pattern: Pattern, base: string, accent: string): THREE.CanvasTexture | null {
  if (pattern === 'none') return null
  const { c, ctx } = newCanvas()
  ctx.fillStyle = base
  ctx.fillRect(0, 0, SIZE, SIZE)

  switch (pattern) {
    case 'stripe': {
      // Twin centre racing stripes with thin contrast pinstripes.
      const cx = SIZE / 2
      ctx.fillStyle = shade(accent, -0.28)
      ctx.fillRect(cx - 86, 0, 172, SIZE)
      ctx.fillStyle = accent
      ctx.fillRect(cx - 76, 0, 64, SIZE)
      ctx.fillRect(cx + 12, 0, 64, SIZE)
      break
    }

    case 'flames': {
      // Three layered flame fronts rising from the lower third.
      const layer = (color: string, h: number, phase: number) => {
        const yBase = SIZE * 0.72
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(0, SIZE)
        ctx.lineTo(0, yBase)
        const tongues = 5
        const w = SIZE / tongues
        for (let i = 0; i < tongues; i++) {
          const x0 = i * w, xm = x0 + w / 2, x1 = x0 + w
          const peak = yBase - h * (0.7 + 0.3 * Math.sin(i * 2 + phase))
          ctx.quadraticCurveTo(x0 + w * 0.22, yBase - h * 0.3, xm, peak)
          ctx.quadraticCurveTo(x1 - w * 0.22, yBase - h * 0.3, x1, yBase)
        }
        ctx.lineTo(SIZE, SIZE)
        ctx.closePath()
        ctx.fill()
      }
      layer(shade(accent, -0.18), 250, 0)
      layer(accent, 185, 1.2)
      layer(shade(accent, 0.3), 110, 2.3)
      break
    }

    case 'carbon': {
      // 2x2 twill weave with a soft diagonal sheen.
      const tile = 12
      for (let y = 0; y < SIZE; y += tile) {
        for (let x = 0; x < SIZE; x += tile) {
          const dark = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0
          ctx.fillStyle = dark ? '#191b21' : '#272a32'
          ctx.fillRect(x, y, tile, tile)
          ctx.fillStyle = 'rgba(255,255,255,0.06)'
          ctx.fillRect(x, y, tile, tile / 2)
        }
      }
      const g = ctx.createLinearGradient(0, 0, SIZE, SIZE)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.1)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)
      break
    }

    case 'checker': {
      // Chequered-flag grid in base + accent.
      const sq = SIZE / 8
      for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
          if ((i + j) % 2 === 0) continue
          ctx.fillStyle = accent
          ctx.fillRect(i * sq, j * sq, sq, sq)
        }
      }
      break
    }

    case 'chevron': {
      // Forward-pointing arrows.
      ctx.strokeStyle = accent
      ctx.lineWidth = 30
      ctx.lineJoin = 'round'
      for (let y = -120; y < SIZE + 120; y += 86) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(SIZE / 2, y + 90)
        ctx.lineTo(SIZE, y)
        ctx.stroke()
      }
      break
    }

    case 'fade': {
      // Two-tone diagonal fade from base into accent.
      const g = ctx.createLinearGradient(0, 0, SIZE, SIZE)
      g.addColorStop(0, base)
      g.addColorStop(0.45, base)
      g.addColorStop(1, accent)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)
      break
    }

    case 'hex': {
      // Honeycomb mesh of accent outlines.
      ctx.strokeStyle = accent
      ctx.lineWidth = 4
      const r = 34
      const w = r * Math.sqrt(3)
      const h = r * 1.5
      for (let row = -1, y = 0; y < SIZE + h; row++, y = row * h) {
        const offset = row % 2 === 0 ? 0 : w / 2
        for (let x = -w; x < SIZE + w; x += w) {
          regularPolygon(ctx, x + offset, y, r, 6, Math.PI / 6)
          ctx.stroke()
        }
      }
      break
    }

    case 'camo': {
      // Overlapping blobs in three derived shades + sparse accent.
      const r = rng(1337)
      const shades = [shade(base, -0.16), shade(base, 0.1), shade(base, -0.06), accent]
      for (let i = 0; i < 46; i++) {
        const col = i % 11 === 0 ? shades[3] : shades[i % 3]
        ctx.fillStyle = col
        const cx = r() * SIZE
        const cy = r() * SIZE
        ctx.beginPath()
        const blobs = 4 + Math.floor(r() * 3)
        for (let b = 0; b < blobs; b++) {
          const a = (b / blobs) * Math.PI * 2
          const rr = 26 + r() * 40
          ctx.ellipse(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, rr, rr * 0.75, a, 0, Math.PI * 2)
        }
        ctx.fill()
      }
      break
    }

    case 'bolt': {
      // Jagged lightning streaks.
      const r = rng(7)
      ctx.strokeStyle = accent
      ctx.lineWidth = 9
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      for (let s = 0; s < 5; s++) {
        let x = (s + 0.5) * (SIZE / 5)
        ctx.beginPath()
        ctx.moveTo(x, -10)
        for (let y = 0; y < SIZE + 40; y += 46) {
          x += (r() - 0.5) * 120
          ctx.lineTo(Math.max(8, Math.min(SIZE - 8, x)), y)
        }
        ctx.stroke()
      }
      break
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  if (pattern === 'carbon') {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 4)
  }
  return tex
}

/** A transparent decal: a number inside a thin roundel. */
export function makeNumberTexture(num: string, color: string): THREE.CanvasTexture {
  const { c, ctx } = newCanvas(256)
  ctx.clearRect(0, 0, 256, 256)
  ctx.strokeStyle = color
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.arc(128, 128, 96, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = 'bold 150px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(num || '0', 128, 138, 150)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** A transparent decal: the driver name / initials. */
export function makeNameTexture(name: string, color: string): THREE.CanvasTexture {
  const { c, ctx } = newCanvas(512)
  c.height = 128
  ctx.clearRect(0, 0, 512, 128)
  ctx.fillStyle = color
  ctx.font = 'bold 90px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name || ' ', 256, 70, 480)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}
