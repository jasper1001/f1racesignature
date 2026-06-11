import type { Driver, Race, Circuit, Telemetry } from './types'

// Static data files are immutable per deploy — let the browser cache them.
// Combined with TanStack Query's in-memory cache, each file is fetched at most
// once per session and repeat selections are instant (no network call).
const CACHE = { cache: 'force-cache' } as const

export async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch('/data/drivers.json', CACHE)
  return res.json()
}

export async function fetchRaces(): Promise<Race[]> {
  const res = await fetch('/data/races.json', CACHE)
  return res.json()
}

export async function fetchCircuits(): Promise<Record<string, Circuit>> {
  const res = await fetch('/data/circuits.json', CACHE)
  return res.json()
}

export async function fetchTelemetry(fileKey: string): Promise<Telemetry> {
  const res = await fetch(`/data/telemetry/${fileKey}.json`, CACHE)
  return res.json()
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

export function formatLapTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

export function parselapTime(lapTime: string): number {
  const [min, sec] = lapTime.split(':')
  return parseInt(min) * 60 + parseFloat(sec)
}
