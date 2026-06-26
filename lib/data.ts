import type { Driver, Race, Circuit, Telemetry, TrackCenterline } from './types'

// Default fetch revalidates against the CDN (so new drivers/races appear after a
// deploy), while TanStack Query's staleTime: Infinity means each file is fetched
// at most once per session — repeat selections stay instant and bandwidth stays low.
export async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch('/data/drivers.json')
  return res.json()
}

export async function fetchRaces(): Promise<Race[]> {
  const res = await fetch('/data/races.json')
  return res.json()
}

export async function fetchCircuits(): Promise<Record<string, Circuit>> {
  const res = await fetch('/data/circuits.json')
  return res.json()
}

export async function fetchTelemetry(fileKey: string): Promise<Telemetry> {
  const res = await fetch(`/data/telemetry/${fileKey}.json`)
  return res.json()
}

// Real OSM-derived track centreline for the "Racing Line" viz. Only some circuits
// have a built track file (see scripts/build-racingline-track.mjs) — returns null
// for those that don't, so the viz can fall back gracefully.
export async function fetchTrackCenterline(circuitId: string): Promise<TrackCenterline | null> {
  try {
    const res = await fetch(`/data/tracks/${circuitId}.json`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function getRacesForDriver(races: Race[], driverId: string): Race[] {
  return races.filter((r) => r.driverId === driverId)
}

export function speedToColor(
  speed: number,
  minSpeed: number,
  maxSpeed: number,
  slowColor = '#1a88ff',
  fastColor = '#ff1a1a',
): string {
  const t = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)))
  return interpolateColor(slowColor, fastColor, t)
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('')
  )
}

export function interpolateColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0, s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default:  h = (r - g) / d + 4
    }
    h *= 60
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  if (s === 0) return [l * 255, l * 255, l * 255]
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255]
}

/**
 * Keeps every colour in the list visually distinct: the first use of a colour
 * is left untouched; repeats (e.g. two same-team drivers sharing a livery) are
 * nudged — hue rotated and lightened a step at a time — until unique.
 */
export function distinctColors(colors: string[]): string[] {
  const used = new Set<string>()
  return colors.map((c) => {
    let out = c
    let step = 1
    while (used.has(out.toLowerCase())) {
      const [h, s, l] = rgbToHsl(...hexToRgb(c))
      const [r, g, b] = hslToRgb((h + 40 * step) % 360, Math.max(0.5, s), Math.min(0.78, l + 0.12 * step))
      out = rgbToHex(r, g, b)
      step++
    }
    used.add(out.toLowerCase())
    return out
  })
}

export function formatLapTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

export function parselapTime(lapTime: string): number {
  const [min, sec] = lapTime.split(':')
  return parseInt(min) * 60 + parseFloat(sec)
}
