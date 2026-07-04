'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Driver, Race, Telemetry, Circuit, ThemeConfig, VizMode, TrackCenterline } from '@/lib/types'
import { RacingLine } from '@/components/visualizations/RacingLine'
import { SpeedHeatmap } from '@/components/visualizations/SpeedHeatmap'
import { SectorSplit } from '@/components/visualizations/SectorSplit'
import { OvertakeMap } from '@/components/visualizations/OvertakeMap'
import { VIZ_MODES } from '@/lib/themes'
import { interpolateColor, distinctColors } from '@/lib/data'
import { teamAtYear } from '@/lib/driverTeams'
import { computeRacingLine, projectLapToRibbon, separatedComparisonLines } from '@/lib/racingLine'

const POSTER_W = 720
const POSTER_H = 800
// On-screen width (px) of the real-track asphalt ribbon in "Racing Line" mode.
// Wide enough that the racing line visibly runs to the edges and clips apexes.
const REAL_RIBBON_PX = 30
// Track container — the box the circuit outline + racing line are fitted into.
const CIRCUIT_AREA = { x: 40, y: 86, w: 640, h: 464 }
// Coordinate space the circuit paths are authored in (scripts/generate-circuits.mjs).
const PATH_VB = { w: 500, h: 420 }
// Padding kept inside CIRCUIT_AREA when fitting, so the track ribbon's half-stroke
// (~17px on-screen) never butts against the box edge.
const FIT_PAD = 0.055

interface CircuitFit { scale: number; tx: number; ty: number }

// F1's official circuit maps are landscape, and our wide track area suits that.
// Many baked paths are authored portrait (taller than wide), so auto-rotate those
// 90° into landscape to give the track more room. Returns degrees (clockwise).
// Applied in PATH space to BOTH the outline and the telemetry line so they stay
// glued together; the shared fit then re-centres + re-scales the rotated result.
function landscapeRotation(bounds: { x0: number; y0: number; x1: number; y1: number }): number {
  return bounds.y1 - bounds.y0 > bounds.x1 - bounds.x0 ? 90 : 0
}

// Manual orientation overrides (degrees, clockwise) that take precedence over the
// bounding-box rule above. Needed for tracks whose layout runs diagonally, where a
// 0/90° snap can't make them horizontal — e.g. Monaco's long axis sits at ~-50°, so
// a 90° snap still reads vertical; ~50° lays it flat (≈2.6:1 landscape).
const CIRCUIT_ROTATION: Record<string, number> = { monaco: 50 }

// Rotate a PATH-space point about the centre of PATH_VB.
function rotatePathCoord(x: number, y: number, deg: number): { x: number; y: number } {
  if (!deg) return { x, y }
  const r = (deg * Math.PI) / 180
  const cx = PATH_VB.w / 2, cy = PATH_VB.h / 2
  const dx = x - cx, dy = y - cy
  return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) }
}

// Rotate every coordinate pair of an M/L/Z path string (no curves → all numbers
// are x,y pairs in order).
function rotatePath(path: string, deg: number): string {
  if (!deg) return path
  const tokens = path.trim().split(/\s+/)
  const numIdx = tokens.map((t, i) => (/^-?\d/.test(t) ? i : -1)).filter((i) => i >= 0)
  for (let k = 0; k + 1 < numIdx.length; k += 2) {
    const xi = numIdx[k], yi = numIdx[k + 1]
    const p = rotatePathCoord(parseFloat(tokens[xi]), parseFloat(tokens[yi]), deg)
    tokens[xi] = p.x.toFixed(1)
    tokens[yi] = p.y.toFixed(1)
  }
  return tokens.join(' ')
}

// Exact bounds of an M/L/Z circuit path — no curves, so every coord pair is on-path.
function pathBounds(path: string): { x0: number; y0: number; x1: number; y1: number } {
  const nums = path.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i + 1]
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  return { x0, y0, x1, y1 }
}

/**
 * THE single fit transform shared by both the circuit outline and the racing
 * line. Maps the track's path bounds into CIRCUIT_AREA (inset by FIT_PAD) with a
 * uniform scale (aspect preserved, no distortion), centred. Both render paths
 * MUST consume the object this returns — never reimplement the maths — so the
 * racing line can never drift off the track.
 *
 * Result maps a PATH-SPACE point (0..PATH_VB) to screen px:
 *   screenX = px * scale + tx ;  screenY = py * scale + ty
 */
function computeCircuitFit(bounds: { x0: number; y0: number; x1: number; y1: number }): CircuitFit {
  const bw = bounds.x1 - bounds.x0
  const bh = bounds.y1 - bounds.y0
  const innerW = CIRCUIT_AREA.w * (1 - 2 * FIT_PAD)
  const innerH = CIRCUIT_AREA.h * (1 - 2 * FIT_PAD)
  const scale = Math.min(innerW / bw, innerH / bh)
  const tx = CIRCUIT_AREA.x + (CIRCUIT_AREA.w - bw * scale) / 2 - bounds.x0 * scale
  const ty = CIRCUIT_AREA.y + (CIRCUIT_AREA.h - bh * scale) / 2 - bounds.y0 * scale
  return { scale, tx, ty }
}

// Bounds source for the fit: the (already-rotated) circuit outline when present
// so it is never clipped, else the telemetry lap converted into rotated path space.
function fitBounds(circuitPath: string | null, telemetry: Telemetry | null, rot: number) {
  if (circuitPath) return pathBounds(circuitPath)
  if (telemetry && telemetry.points.length > 1) {
    const ps = telemetry.points.map((p) => rotatePathCoord(p.x * PATH_VB.w, p.y * PATH_VB.h, rot))
    const xs = ps.map((p) => p.x)
    const ys = ps.map((p) => p.y)
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
  }
  return { x0: 0, y0: 0, x1: PATH_VB.w, y1: PATH_VB.h }
}

// One head-to-head lap to overlay against the main lap.
export interface ComparisonLap {
  driver: Driver | null
  telemetry: Telemetry | null
  race: Race | null
}

interface PosterPreviewProps {
  driver: Driver | null
  race: Race | null
  telemetry: Telemetry | null
  circuit: Circuit | null
  theme: ThemeConfig
  vizMode: VizMode
  isFreeTier?: boolean
  // Head-to-head comparison — up to two extra laps on the same circuit.
  compares?: ComparisonLap[]
  // Lap playback: 0..1 progress, or null when not playing
  playbackProgress?: number | null
  // Real OSM track centreline for the 'racing_line_real' viz (null = fall back).
  trackCenterline?: TrackCenterline | null
}

function parseLapSeconds(s: string): number {
  const [m, sec] = s.split(':')
  return parseInt(m) * 60 + parseFloat(sec)
}

// Normalised cumulative-time profile for a lap (0..1 per point) from distance +
// speed, so a car moves fast on straights and slow in corners. Falls back to
// even spacing when distance/speed are missing.
function lapTimeProfile(pts: { speed: number; distance?: number }[]): number[] {
  const tau = [0]
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const dd = Math.max(0, (pts[i].distance ?? i) - (pts[i - 1].distance ?? i - 1))
    const v = Math.max(1, (pts[i].speed + pts[i - 1].speed) / 2)
    total += dd / v
    tau.push(total)
  }
  if (total > 0) return tau.map((t) => t / total)
  return tau.map((_, i) => i / (pts.length - 1))
}

// Interpolated car position at fraction `f` (0..1) of its own lap time.
function carAtFraction(
  pts: { x: number; y: number; speed: number }[],
  tau: number[],
  f: number,
): { x: number; y: number; speed: number; idx: number } {
  const cf = Math.min(1, Math.max(0, f))
  let i = 0
  while (i < tau.length - 2 && tau[i + 1] < cf) i++
  const span = (tau[i + 1] - tau[i]) || 1
  const local = Math.min(1, Math.max(0, (cf - tau[i]) / span))
  const a = pts[i], b = pts[Math.min(pts.length - 1, i + 1)]
  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
    speed: a.speed + (b.speed - a.speed) * local,
    idx: i,
  }
}

// Normalised cumulative arc-length (0..1) along a polyline.
function cumFrac(pts: { x: number; y: number }[]): number[] {
  const f = [0]
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    f.push(total)
  }
  return total > 0 ? f.map((d) => d / total) : f.map((_, i) => i / Math.max(1, pts.length - 1))
}

// Carry telemetry's speed/throttle/brake onto an alternate lap geometry (the ideal
// racing line) by matching cumulative-distance fraction, so the playback car can
// drive the SAME line that's drawn while keeping the real speed/throttle/brake
// profile. Returns one sample per geometry point.
function attrsAlongGeometry(
  geom: { x: number; y: number }[],
  tel: { x: number; y: number; speed: number; throttle?: number; brake?: number }[],
): { x: number; y: number; speed: number; throttle: number; brake: number }[] {
  const tf = cumFrac(tel)
  const gf = cumFrac(geom)
  return geom.map((g, j) => {
    const f = gf[j]
    let i = 0
    while (i < tf.length - 2 && tf[i + 1] < f) i++
    const span = (tf[i + 1] - tf[i]) || 1
    const t = Math.min(1, Math.max(0, (f - tf[i]) / span))
    const a = tel[i], b = tel[Math.min(tel.length - 1, i + 1)]
    return {
      x: g.x,
      y: g.y,
      speed: a.speed + (b.speed - a.speed) * t,
      throttle: (a.throttle ?? 0) + ((b.throttle ?? 0) - (a.throttle ?? 0)) * t,
      brake: (a.brake ?? 0) + ((b.brake ?? 0) - (a.brake ?? 0)) * t,
    }
  })
}

// Sample a lap's speed/throttle/brake/distance at lap-distance fraction `t` (0..1).
// Used to carry the real profile onto the deviation-amplified comparison lines, so
// the ghost-race cars pace correctly (slow in corners) while driving those lines.
function sampleLapByDistanceFrac(
  pts: { speed: number; throttle?: number; brake?: number; distance?: number }[],
  t: number,
): { speed: number; throttle: number; brake: number; distance: number } {
  const n = pts.length
  const d0 = pts[0].distance ?? 0
  const span = (pts[n - 1].distance ?? n - 1) - d0 || 1
  const fracAt = (i: number) => (((pts[i].distance ?? i) - d0) / span)
  let i = 0
  while (i < n - 2 && fracAt(i + 1) < t) i++
  const fa = fracAt(i), fb = fracAt(i + 1)
  const u = fb > fa ? Math.min(1, Math.max(0, (t - fa) / (fb - fa))) : 0
  const a = pts[i], b = pts[Math.min(n - 1, i + 1)]
  const lp = (x: number, y: number) => x + (y - x) * u
  return {
    speed: lp(a.speed, b.speed),
    throttle: lp(a.throttle ?? 0, b.throttle ?? 0),
    brake: lp(a.brake ?? 0, b.brake ?? 0),
    distance: lp(a.distance ?? 0, b.distance ?? 0),
  }
}

function CircuitBackground({ path, fit }: { path: string; fit: CircuitFit }) {
  // The paths render inside a scale(fit.scale) group, so a raw strokeWidth gets
  // multiplied by the fit — fattening the ribbon on big/scaled-up circuits until
  // tight corners merge. Divide by the scale so the ribbon is a CONSTANT on-screen
  // thickness on every track, keeping clean spacing between sections.
  const sw = (px: number) => px / fit.scale
  return (
    <g>
      <g transform={`translate(${fit.tx}, ${fit.ty}) scale(${fit.scale})`}>
        {/* Asphalt track surface — wide road ribbon */}
        <path d={path} fill="none" stroke="#3a3a3a" strokeWidth={sw(34)} strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        {/* Lighter inner surface, leaving a darker edge so it reads as a road */}
        <path d={path} fill="none" stroke="#5a5a5a" strokeWidth={sw(24)} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </g>
    </g>
  )
}

// Real circuit surface for the "Racing Line" viz: an OSM-derived centreline drawn
// as an asphalt ribbon at true track width (in PATH units, so it scales with the
// fit), with a kerb-like edge. The actual racing line is overlaid separately, so
// it visibly runs wide on entry and clips the apex inside this ribbon.
function RealTrackRibbon({ path, fit, widthPx }: { path: string; fit: CircuitFit; widthPx: number }) {
  // Paths render inside scale(fit.scale), so divide by it to keep the ribbon a
  // CONSTANT on-screen thickness (widthPx) on every circuit and zoom level.
  const sw = (px: number) => px / fit.scale
  return (
    <g transform={`translate(${fit.tx}, ${fit.ty}) scale(${fit.scale})`}>
      {/* Kerb / track edge */}
      <path d={path} fill="none" stroke="#e3e3e3" strokeWidth={sw(widthPx + 2.5)} strokeLinecap="round" strokeLinejoin="round" opacity="0.28" />
      {/* Asphalt surface */}
      <path d={path} fill="none" stroke="#2c2c2c" strokeWidth={sw(widthPx)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="#444444" strokeWidth={sw(widthPx * 0.62)} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </g>
  )
}

// Stylised track ribbon built directly from the lap line (poster-space 0-1 points),
// used for real GPS laps where the stored outlines don't match the actual path. The
// thin racing line is drawn on top from the SAME points, so it can never drift off.
function LineRibbon({ pts }: { pts: { x: number; y: number }[] }) {
  if (pts.length < 2) return null
  const d =
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x * POSTER_W).toFixed(1)} ${(p.y * POSTER_H).toFixed(1)}`).join(' ') +
    ` L ${(pts[0].x * POSTER_W).toFixed(1)} ${(pts[0].y * POSTER_H).toFixed(1)}` // close the lap
  return (
    <g>
      {/* Asphalt track surface — wide road ribbon */}
      <path d={d} fill="none" stroke="#3a3a3a" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      {/* Lighter inner surface, leaving a darker edge so it reads as a road */}
      <path d={d} fill="none" stroke="#5a5a5a" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </g>
  )
}

// Wide track drawn along the drivers' shared mean line, for the deviation-amplified
// head-to-head. Rendered to read like a real circuit: dark asphalt, white edge lines
// down both sides, red/white kerbs through the corners, and a start/finish line. The
// two exaggerated racing lines are drawn on top (in renderViz), inside the kerbs.
const PAIR_HALF = 26 // asphalt half-width in px (racing lines are amplified to ±22)
function PairRibbon({ pts }: { pts: { x: number; y: number }[] }) {
  if (pts.length < 3) return null
  const P = pts.map((p) => ({ x: p.x * POSTER_W, y: p.y * POSTER_H }))
  const n = P.length
  const toPath = (q: { x: number; y: number }[]) =>
    q.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  // Per-point unit tangent + left normal from neighbouring points.
  const tan: { x: number; y: number }[] = []
  const nrm: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]
    const tx = b.x - a.x, ty = b.y - a.y
    const tl = Math.hypot(tx, ty) || 1
    tan.push({ x: tx / tl, y: ty / tl })
    nrm.push({ x: -ty / tl, y: tx / tl })
  }

  // Corner mask: local turning angle over a small window → kerb regions (dilated).
  const W = 3
  const corner = new Array<boolean>(n).fill(false)
  for (let i = W; i < n - W; i++) {
    const a = P[i - W], b = P[i], c = P[i + W]
    const v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y
    const ang = Math.abs(Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y))
    if (ang > 0.13) corner[i] = true
  }
  const dil = corner.slice()
  for (let i = 0; i < n; i++) if (corner[i]) for (let d = -5; d <= 5; d++) { const j = i + d; if (j >= 0 && j < n) dil[j] = true }

  // De-folded edges for the continuous white track-edge lines: offset the mean line
  // by ±half, then drop any point that doesn't advance along the travel direction, so
  // the inside edge of a tight corner collapses to a clean chord instead of a spike.
  const cleanEdge = (side: 1 | -1) => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) {
      const p = { x: P[i].x + side * nrm[i].x * PAIR_HALF, y: P[i].y + side * nrm[i].y * PAIR_HALF }
      if (pts.length === 0) { pts.push(p); continue }
      const last = pts[pts.length - 1]
      if ((p.x - last.x) * tan[i].x + (p.y - last.y) * tan[i].y > 0) pts.push(p)
    }
    return pts
  }
  const leftEdge = cleanEdge(1)
  const rightEdge = cleanEdge(-1)

  // Kerbs on the OUTSIDE edge of each corner ONLY. Drawing both edges makes the kerbs
  // collide in tight sections (the reported overlap); the outside (convex) edge is
  // also fold-free. Outside is opposite the turn, from a smoothed turn signal so the
  // chosen side doesn't flicker point-to-point; runs break on a gap or a side change.
  const cross = new Array<number>(n).fill(0)
  for (let i = W; i < n - W; i++) {
    const a = P[i - W], b = P[i], c = P[i + W]
    cross[i] = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
  }
  const cs = cross.map((_, i) => {
    let s = 0, w = 0
    for (let k = -4; k <= 4; k++) { const j = i + k; if (j >= 0 && j < n) { s += cross[j]; w++ } }
    return s / (w || 1)
  })
  const kerbRuns: { x: number; y: number }[][] = []
  {
    let cur: { x: number; y: number }[] = []
    let curSide = 0
    for (let i = 0; i < n; i++) {
      if (!dil[i]) { if (cur.length > 1) kerbRuns.push(cur); cur = []; curSide = 0; continue }
      const side = cs[i] >= 0 ? -1 : 1
      if (curSide !== 0 && side !== curSide) { if (cur.length > 1) kerbRuns.push(cur); cur = [] }
      curSide = side
      cur.push({ x: P[i].x + side * nrm[i].x * PAIR_HALF, y: P[i].y + side * nrm[i].y * PAIR_HALF })
    }
    if (cur.length > 1) kerbRuns.push(cur)
  }

  const centerD = toPath(P)
  const l0 = { x: P[0].x + nrm[0].x * PAIR_HALF, y: P[0].y + nrm[0].y * PAIR_HALF }
  const r0 = { x: P[0].x - nrm[0].x * PAIR_HALF, y: P[0].y - nrm[0].y * PAIR_HALF }
  return (
    <g>
      {/* Asphalt: darker run-off border, then the track surface */}
      <path d={centerD} fill="none" stroke="#1c1c1c" strokeWidth={PAIR_HALF * 2 + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={centerD} fill="none" stroke="#333333" strokeWidth={PAIR_HALF * 2} strokeLinecap="round" strokeLinejoin="round" />
      {/* White track-edge lines down both sides */}
      <path d={toPath(leftEdge)} fill="none" stroke="#e8e8e8" strokeWidth={1.8} strokeLinejoin="round" opacity="0.5" />
      <path d={toPath(rightEdge)} fill="none" stroke="#e8e8e8" strokeWidth={1.8} strokeLinejoin="round" opacity="0.5" />
      {/* Red/white kerbs on the outside of each corner (white base + red dashes) */}
      {kerbRuns.map((run, i) => (
        <g key={i}>
          <path d={toPath(run)} fill="none" stroke="#f4f4f4" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={toPath(run)} fill="none" stroke="#d81f26" strokeWidth={4.5} strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* Start/finish line across the track */}
      <line x1={l0.x} y1={l0.y} x2={r0.x} y2={r0.y} stroke="#f4f4f4" strokeWidth={5} strokeLinecap="butt" />
      <line x1={l0.x} y1={l0.y} x2={r0.x} y2={r0.y} stroke="#1c1c1c" strokeWidth={5} strokeDasharray="4 4" strokeLinecap="butt" />
    </g>
  )
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if ((line + word).length > maxChars) {
      if (line) lines.push(line.trim())
      line = word + ' '
    } else {
      line += word + ' '
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

function Watermark({ theme }: { theme: ThemeConfig }) {
  return (
    <g>
      {/* Bottom-left corner tag — sits inside the circuit area, clear of the
          centred driver name in the header row */}
      <text
        x={CIRCUIT_AREA.x + 8}
        y={CIRCUIT_AREA.y + CIRCUIT_AREA.h - 6}
        fill={theme.primaryLine}
        fontSize="9"
        fontFamily="monospace"
        fontWeight="700"
        letterSpacing="2.5"
        opacity="0.7"
      >
        F1RACESIGNATURE.SITE
      </text>
      {/* Diagonal ghost across stats section */}
      <g transform={`translate(${POSTER_W / 2}, 660) rotate(-20)`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={theme.primaryLine}
          fontSize="26"
          fontFamily="Georgia, serif"
          letterSpacing="12"
          opacity="0.1"
          fontStyle="italic"
        >
          F1RACESIGNATURE.SITE
        </text>
      </g>
    </g>
  )
}

export function PosterPreview({
  driver,
  race,
  telemetry,
  circuit,
  theme,
  vizMode,
  isFreeTier = true,
  compares = [],
  playbackProgress = null,
  trackCenterline = null,
}: PosterPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const isPlaying = playbackProgress !== null

  // Draw-on reveal: 0..1 while the racing line is drawing itself, null once it has
  // settled into the static poster. Re-triggered whenever the lap, viz mode, or
  // compare set changes (effect below). Suppressed during play/MP4 capture.
  const [reveal, setReveal] = useState<number | null>(null)
  const revealRaf = useRef<number | null>(null)

  // How the lap was produced decides where the track ribbon comes from:
  //   • real GPS laps (source 'fastf1') are the car's actual path — ground truth.
  //     Our stored outlines (circuits.json path AND the OSM centreline) are both
  //     distorted relative to it (alignment residual ≫ track width), so no transform
  //     places the lap on them. We therefore build the ribbon FROM the lap line
  //     itself, guaranteeing the racing line sits on its track.
  //   • generated-template laps are co-registered with the circuits.json outline, so
  //     they keep the real circuit outline as the ribbon.
  // Both can occur on one circuit (e.g. Red Bull Ring: a 2024 GPS lap + a 2016 one).
  const isRealGps = telemetry?.source === 'fastf1'
  const geomPath = isRealGps ? null : (circuit?.path ?? null)

  // Auto-orient portrait tracks to landscape, in path space (outline + telemetry alike).
  // A manual override wins when present (diagonal tracks the bbox rule can't read).
  const rot = (() => {
    const override = circuit ? CIRCUIT_ROTATION[circuit.id] : undefined
    if (override !== undefined) return override
    if (geomPath) return landscapeRotation(pathBounds(geomPath))
    if (telemetry && telemetry.points.length > 1) {
      const xs = telemetry.points.map((p) => p.x)
      const ys = telemetry.points.map((p) => p.y)
      return landscapeRotation({ x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) })
    }
    return 0
  })()
  const circuitPath = geomPath ? rotatePath(geomPath, rot) : null

  // 'Racing Line' (real) mode draws the OSM centreline as a to-scale asphalt ribbon
  // and overlays the IDEAL geometric racing line (computed from the centreline, see
  // racingLinePoints below). Used for ALL laps here — GPS or generated — because the
  // line is derived from the track, not the telemetry, so it never depends on the
  // lap aligning to the (sometimes-distorted) centreline.
  const realTrack = vizMode === 'racing_line_real' && trackCenterline ? trackCenterline : null
  const realTrackPath = realTrack ? rotatePath(realTrack.centerlinePath, rot) : null

  // Head-to-head in 'Racing Line' mode. The OSM centreline is a DIFFERENT geometry
  // than the stored GPS on many circuits (corners in different places — Zandvoort's
  // laps sit ~30 m off the OSM ribbon), so snapping the laps onto it distorts each
  // driver's real line and collapses the two drivers into one. When comparing we
  // therefore show each lap's ACTUAL GPS line and build the ribbon from the lap
  // itself. Single-driver mode is unaffected: it draws the ideal geometric line,
  // derived from the centreline (not the telemetry), so the mismatch doesn't apply.
  const validCompares = compares.filter((c) => c.driver && c.telemetry && c.telemetry.points.length > 1)
  const h2hRealLine = vizMode === 'racing_line_real' && validCompares.length > 0

  // The one fit shared by the outline (via CircuitBackground) and the racing
  // line below — computed once so the two paths can never diverge. In 'Racing Line'
  // mode the real-track ribbon is what's drawn, so frame the fit to IT (the lap may
  // be a GPS path with different bounds); otherwise frame the circuit outline/lap.
  // For head-to-head real lines, frame the telemetry (the ribbon comes from the lap).
  const fit = computeCircuitFit(fitBounds(h2hRealLine ? null : (realTrackPath ?? circuitPath), telemetry, rot))

  // Parsed real-track centreline (rotated PATH space) + corridor half-width,
  // shared by the ideal racing line and the telemetry-to-ribbon alignment below.
  const realCenter = useMemo(() => {
    if (!realTrackPath) return null
    const nums = realTrackPath.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
    const center: { x: number; y: number }[] = []
    for (let i = 0; i + 1 < nums.length; i += 2) center.push({ x: nums[i], y: nums[i + 1] })
    if (center.length < 8) return null
    // Drop a duplicated closing point so the loop wraps cleanly.
    const first = center[0], last = center[center.length - 1]
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1.5) center.pop()
    // Corridor half-width in PATH units: the on-screen ribbon stroke is
    // REAL_RIBBON_PX, drawn inside scale(fit), so its PATH width is /scale.
    // Keep a kerb margin so the line stays on asphalt, not the white edge.
    const corridorHalf = Math.max(2, (REAL_RIBBON_PX / 2 - 4) / fit.scale)
    return { center, corridorHalf }
  }, [realTrackPath, fit.scale])

  // Direct path→poster mapping: the lap drawn exactly as stored (path space →
  // rotate → shared fit → poster 0-1), no ribbon reconstruction.
  const mapDirect = (tel: Telemetry | null) =>
    tel
      ? tel.points.map((pt) => {
          const p = rotatePathCoord(pt.x * PATH_VB.w, pt.y * PATH_VB.h, rot)
          return { ...pt, x: (p.x * fit.scale + fit.tx) / POSTER_W, y: (p.y * fit.scale + fit.ty) / POSTER_H }
        })
      : []

  const toPosterSpace = (tel: Telemetry | null) => {
    if (!tel) return []
    if (!realCenter) return mapDirect(tel)
    // Path space (0..PATH_VB) → rotate → screen via the shared fit → poster 0-1.
    const raw = tel.points.map((pt) => rotatePathCoord(pt.x * PATH_VB.w, pt.y * PATH_VB.h, rot))
    // In 'Racing Line' mode the GPS lap is drawn over the OSM ribbon (head-to-head
    // lines, playback trails). Stored telemetry frames drift off that ribbon on
    // some circuits, so project each lap onto it by RECONSTRUCTION: coarse
    // similarity ICP, then rebuild every point from its real lap-distance
    // (laid along the centreline arc) + its clamped lateral offset. Real
    // lap-distance fractions pace that — the drawn frame is distorted on some
    // circuits, but the telemetry's distance field is not.
    const lapFrac = tel.points.map((pt, i) => pt.distance ?? i / Math.max(1, tel.points.length - 1))
    const { pts: snapped, frac } = projectLapToRibbon(raw, realCenter.center, realCenter.corridorHalf, lapFrac)
    const last = tel.points.length - 1
    return snapped.map((p, k) => {
      const i = Math.min(last, Math.floor(frac[k]))
      const j = Math.min(last, i + 1)
      const t = frac[k] - i
      const a = tel.points[i]
      const b = tel.points[j]
      const lerp = (u: number | undefined, v: number | undefined) => (u ?? 0) + ((v ?? 0) - (u ?? 0)) * t
      return {
        ...a,
        speed: lerp(a.speed, b.speed),
        throttle: lerp(a.throttle, b.throttle),
        brake: lerp(a.brake, b.brake),
        distance: lerp(a.distance, b.distance),
        x: (p.x * fit.scale + fit.tx) / POSTER_W,
        y: (p.y * fit.scale + fit.ty) / POSTER_H,
      }
    })
  }

  // Cache projected laps by telemetry identity. In 'Racing Line' mode
  // toPosterSpace runs an ICP + ribbon reconstruction (~3-6ms/lap); the 1.1s
  // draw-on reveal re-renders at ~60fps with up to three laps, so without a
  // cache that's ~10-18ms of identical work per frame. Telemetry objects are
  // stable (a new selection fetches a fresh one), so keying on them is safe. A
  // fresh Map is minted whenever the shared geometry (fit / centreline / rotation)
  // changes, invalidating every entry at once.
  const projectCache = useMemo(
    () => new Map<Telemetry, ReturnType<typeof toPosterSpace>>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [realCenter, fit.scale, fit.tx, fit.ty, rot],
  )
  const projectCached = (tel: Telemetry | null) => {
    if (!tel) return []
    let v = projectCache.get(tel)
    if (!v) { v = toPosterSpace(tel); projectCache.set(tel, v) }
    return v
  }

  // Map raw 0-1 telemetry coords into poster-space 0-1
  // Viz components then multiply by POSTER_W/H to get final pixels.
  // Head-to-head real lines skip the OSM reconstruction and draw the lap as-is.
  const vizPoints = h2hRealLine ? mapDirect(telemetry) : projectCached(telemetry)

  // "Racing Line" mode: instead of the centre-following telemetry template,
  // compute the IDEAL geometric racing line on the real track — wide on entry,
  // apex on the inside kerb, wide on exit, within the asphalt corridor. Note the
  // result is a uniform resampling (~600 pts), not one point per centreline node.
  // Computed in the (rotated) PATH space the ribbon is drawn in, then mapped to
  // poster space via the same shared fit so it sits exactly on the ribbon.
  const racingLinePoints = useMemo(() => {
    // Skip in head-to-head: there the fit frames the telemetry, not the OSM ribbon,
    // so the ideal line would be mis-framed — and it isn't drawn (real laps are).
    if (!realCenter || h2hRealLine) return null
    return computeRacingLine(realCenter.center, realCenter.corridorHalf).map((p) => ({
      x: (p.x * fit.scale + fit.tx) / POSTER_W,
      y: (p.y * fit.scale + fit.ty) / POSTER_H,
    }))
  }, [realCenter, h2hRealLine, fit.scale, fit.tx, fit.ty])

  // Head-to-head in a racing-line mode → the deviation-amplified comparison, for ANY
  // number of rivals. Real laps of the same track differ by only a car-width, invisible
  // full-lap, so we build the drivers' shared mean line and push each driver's lateral
  // deviation out by a gain so their different apex/entry choices read clearly. Returns
  // the mean (for the wide ribbon) + each driver's exaggerated line in [primary, ...
  // compares] order, all in poster 0-1 space. Computed in rotated PATH space so it's
  // aspect-correct. Up to two compare telemetries are referenced concretely (the cap is
  // two) to keep the memo deps stable.
  const isRacingLineMode = vizMode === 'racing_line_real' || vizMode === 'racing_line'
  const cmp0Tel = isRacingLineMode ? validCompares[0]?.telemetry ?? null : null
  const cmp1Tel = isRacingLineMode ? validCompares[1]?.telemetry ?? null : null
  const separatedGroup = useMemo(() => {
    if (!telemetry || telemetry.points.length < 8) return null
    const tels = [telemetry, cmp0Tel, cmp1Tel].filter((t): t is Telemetry => !!t && t.points.length > 1)
    if (tels.length < 2) return null
    const toPath = (tel: Telemetry) =>
      tel.points.map((pt) => {
        const p = rotatePathCoord(pt.x * PATH_VB.w, pt.y * PATH_VB.h, rot)
        return { x: p.x, y: p.y, distance: pt.distance }
      })
    // Corridor half-width in PATH units for the amplified lines (≈22px on-screen),
    // so the lines sit inside a comfortably wide drawn ribbon on every circuit.
    const maxHalf = 22 / fit.scale
    const { center, lines } = separatedComparisonLines(tels.map(toPath), { gain: 3.4, maxHalf })
    const toPoster = (pts: { x: number; y: number }[]) =>
      pts.map((p) => ({ x: (p.x * fit.scale + fit.tx) / POSTER_W, y: (p.y * fit.scale + fit.ty) / POSTER_H }))
    // Carry each source lap's speed/throttle/brake/distance onto its amplified line
    // (sampled at the same uniform lap-distance fraction the geometry was built at),
    // so the ghost-race playback drives these lines paced by the real profile.
    const withAttrs = (poster: { x: number; y: number }[], tel: Telemetry) =>
      poster.map((p, k) => ({ ...p, ...sampleLapByDistanceFrac(tel.points, k / (poster.length - 1)) }))
    return {
      center: toPoster(center),
      lines: lines.map((ln, i) => withAttrs(toPoster(ln), tels[i])),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry, cmp0Tel, cmp1Tel, rot, fit.scale, fit.tx, fit.ty])

  // The track outline in screen px — used to place overlay readouts in a corner the
  // ribbon doesn't reach (so they never sit on top of the circuit).
  const trackScreenPts: { x: number; y: number }[] = (() => {
    const out: { x: number; y: number }[] = []
    if (geomPath) {
      const nums = geomPath.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const p = rotatePathCoord(nums[i], nums[i + 1], rot)
        out.push({ x: p.x * fit.scale + fit.tx, y: p.y * fit.scale + fit.ty })
      }
    } else {
      for (const p of vizPoints) out.push({ x: p.x * POSTER_W, y: p.y * POSTER_H })
    }
    return out
  })()

  // Pick the circuit-area corner least covered by the track for a small overlay box.
  // Preference order favours the top-right (where the readout has always lived).
  const cornerForBox = (boxW: number, boxH: number) => {
    const m = 6, wm = 14 // bottom-left watermark reserve
    const L = CIRCUIT_AREA.x, R = CIRCUIT_AREA.x + CIRCUIT_AREA.w
    const T = CIRCUIT_AREA.y, B = CIRCUIT_AREA.y + CIRCUIT_AREA.h
    const corners = [
      { x: R - m - boxW, y: T + m },          // top-right
      { x: L + m, y: T + m },                 // top-left
      { x: R - m - boxW, y: B - m - boxH },   // bottom-right
      { x: L + m, y: B - m - wm - boxH },     // bottom-left (above watermark)
    ]
    const PAD = 10
    const hits = (c: { x: number; y: number }) =>
      trackScreenPts.filter((p) =>
        p.x >= c.x - PAD && p.x <= c.x + boxW + PAD &&
        p.y >= c.y - PAD && p.y <= c.y + boxH + PAD).length
    return corners.map((c) => ({ c, n: hits(c) })).sort((a, b) => a.n - b.n)[0].c
  }

  // Historical livery: when the shown driver matches the race's driver, use the
  // team they actually raced for that year (e.g. Hamilton/Silverstone 2020 = Mercedes).
  const lapColor = (d: Driver, r: Race | null) =>
    (r && r.driverId === d.id ? teamAtYear(d.id, r.year)?.color : null) ?? d.color ?? theme.fastColor
  const histTeam = driver && race && race.driverId === driver.id ? teamAtYear(driver.id, race.year) : null
  const driverBase = histTeam?.color ?? driver?.color ?? theme.primaryLine

  // Up to two head-to-head laps, each with its racing line (poster space) + livery colour.
  // Head-to-head real lines draw the lap as-is; other modes project onto the ribbon.
  const compareBase = validCompares.map((c) => ({
    driver: c.driver!,
    race: c.race,
    telemetry: c.telemetry!,
    points: h2hRealLine ? mapDirect(c.telemetry) : projectCached(c.telemetry),
    baseColor: lapColor(c.driver!, c.race),
  }))
  // Keep every racer's colour distinct (two same-team drivers would otherwise clash).
  const palette = distinctColors([driverBase, ...compareBase.map((c) => c.baseColor)])
  const driverColor = palette[0]
  const compareLaps = compareBase.map((c, i) => ({ ...c, color: palette[i + 1] }))
  const isComparing = compareLaps.length > 0
  // Colours aligned with separatedGroup.lines order: [primary, ...compares].
  const groupColors = [driverColor, ...compareLaps.map((c) => c.color)]

  // The primary lap line for the static viz + draw-on reveal. In "Racing Line"
  // mode (single lap) this is the ideal geometric line; otherwise the telemetry.
  const primaryLine = racingLinePoints && !isComparing ? racingLinePoints : vizPoints

  // Kick off the draw-on reveal when the lap / mode / compare set changes. We key
  // on telemetry identity (a new selection fetches a fresh object), vizMode and
  // compare count — not on theme/colour tweaks, which shouldn't re-draw the line.
  const compareCount = compareLaps.length
  useEffect(() => {
    if (!telemetry || telemetry.points.length < 2 || playbackProgress !== null) {
      setReveal(null)
      return
    }
    const DUR = 1100
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    let start: number | null = null
    setReveal(0)
    const tick = (now: number) => {
      if (start === null) start = now
      const p = Math.min(1, (now - start) / DUR)
      setReveal(p < 1 ? easeOutCubic(p) : null)
      if (p < 1) revealRaf.current = requestAnimationFrame(tick)
    }
    revealRaf.current = requestAnimationFrame(tick)
    return () => { if (revealRaf.current) cancelAnimationFrame(revealRaf.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry, vizMode, compareCount])

  const renderViz = () => {
    if (!telemetry || vizPoints.length === 0) return null

    // ── Compare mode ──
    if (isComparing) {
      const linePath = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x * POSTER_W).toFixed(1)} ${(p.y * POSTER_H).toFixed(1)}`).join(' ')

      // Racing-line head-to-head → deviation-amplified lines: each driver's exaggerated
      // line in their colour, straddling the shared mean, so where drivers took
      // different lines they visibly fan apart (see separatedGroup). Any driver count.
      if (separatedGroup) {
        return (
          <g>
            {separatedGroup.lines.map((ln, i) => (
              <path key={i} d={linePath(ln)} fill="none" stroke={groupColors[i]} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
        )
      }

      // Overlay each driver's OWN line so their paths through the corners can be
      // read against each other. This is what head-to-head is for in the two
      // line-comparison modes — the ideal 'Racing Line' on the real track
      // (h2hRealLine: each lap's actual GPS line, since the OSM ribbon is a
      // different geometry we can't snap to without collapsing the two into one)
      // and the raw 'Lap Trace' — plus any 3-car comparison. The speed-delta map
      // further down shares ONE geometry (useful for "who's faster where", but it
      // defeats a line comparison), so it's reserved for the remaining modes.
      const overlayLines = h2hRealLine || vizMode === 'racing_line' || compareLaps.length > 1
      if (overlayLines) {
        // Compares first (drawn widest), primary last (thinnest, on top), so each
        // line keeps a visible halo even where two laps run within ~1px of each
        // other (e.g. Zandvoort) — a uniform width would bury the lines beneath.
        const overlay = [...compareLaps.map((c) => ({ points: c.points, color: c.color })), { points: vizPoints, color: driverColor }]
        return (
          <g>
            {overlay.map((o, i) => (
              <path key={i} d={linePath(o.points)} fill="none" stroke={o.color} strokeWidth={3 + 2 * (overlay.length - 1 - i)} strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
            ))}
          </g>
        )
      }

      // Exactly one rival in a speed-focused mode → speed-delta map (segments
      // coloured by who's faster at each point along the primary lap's geometry).
      {
        const cmpPoints = compareLaps[0].points
        const compareColor = compareLaps[0].color
        const n = Math.min(vizPoints.length, cmpPoints.length)
        const basePath = vizPoints.slice(0, n).map((p, i) =>
          `${i === 0 ? 'M' : 'L'} ${(p.x * POSTER_W).toFixed(1)} ${(p.y * POSTER_H).toFixed(1)}`
        ).join(' ')

        type Seg = { d: string; d1: boolean }
        const segs: Seg[] = []
        const faster = (i: number) => vizPoints[i].speed >= cmpPoints[i].speed
        let cur: Seg = {
          d: `M ${(vizPoints[0].x * POSTER_W).toFixed(1)} ${(vizPoints[0].y * POSTER_H).toFixed(1)}`,
          d1: faster(0),
        }
        for (let i = 1; i < n; i++) {
          const f = faster(i)
          if (f !== cur.d1) {
            segs.push(cur)
            cur = {
              d: `M ${(vizPoints[i - 1].x * POSTER_W).toFixed(1)} ${(vizPoints[i - 1].y * POSTER_H).toFixed(1)}`,
              d1: f,
            }
          }
          cur.d += ` L ${(vizPoints[i].x * POSTER_W).toFixed(1)} ${(vizPoints[i].y * POSTER_H).toFixed(1)}`
        }
        segs.push(cur)

        return (
          <g>
            <path d={basePath} fill="none" stroke="#1e1e1e" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            {segs.map((s, i) => {
              const color = s.d1 ? driverColor : compareColor
              return (
                <g key={i}>
                  <path d={s.d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
                </g>
              )
            })}
          </g>
        )
      }
    }

    const props = { points: vizPoints, theme, width: POSTER_W, height: POSTER_H, driverColor }

    switch (vizMode) {
      case 'racing_line':      return <RacingLine {...props} />
      case 'racing_line_real':
        // Draw the ideal geometric racing line (edge-apex-edge) on the real
        // track ribbon; fall back to the telemetry line if no track file.
        return <RacingLine {...props} points={racingLinePoints ?? vizPoints} strokeWidth={racingLinePoints ? 3 : 2.2} />
      case 'speed_heatmap': return <SpeedHeatmap {...props} />
      case 'sector_split':  return <SectorSplit {...props} />
      case 'overtake_map':  return <OvertakeMap {...props} />
      default:              return <RacingLine {...props} />
    }
  }

  // Draw-on reveal: the racing line(s) draw themselves from the start line using a
  // stroke-dash sweep, with a leading dot, then hand off to the static viz. Works
  // for every viz mode (it draws the lap line, then the full visualization pops in).
  const renderReveal = () => {
    if (!telemetry || vizPoints.length < 2 || reveal === null) return null

    const r = reveal
    const linePath = (pts: { x: number; y: number }[]) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x * POSTER_W).toFixed(1)} ${(p.y * POSTER_H).toFixed(1)}`).join(' ')
    const lineLen = (pts: { x: number; y: number }[]) => {
      let l = 0
      for (let i = 1; i < pts.length; i++) {
        l += Math.hypot((pts[i].x - pts[i - 1].x) * POSTER_W, (pts[i].y - pts[i - 1].y) * POSTER_H)
      }
      return l
    }
    const headAt = (pts: { x: number; y: number }[]) => {
      const f = r * (pts.length - 1)
      const i = Math.min(pts.length - 2, Math.floor(f))
      const t = f - i
      return {
        x: (pts[i].x + (pts[i + 1].x - pts[i].x) * t) * POSTER_W,
        y: (pts[i].y + (pts[i + 1].y - pts[i].y) * t) * POSTER_H,
      }
    }

    const lines = separatedGroup
      ? separatedGroup.lines.map((ln, i) => ({ points: ln, color: groupColors[i] }))
      : isComparing
        ? [{ points: vizPoints, color: driverColor }, ...compareLaps.map((c) => ({ points: c.points, color: c.color }))]
        : [{ points: primaryLine, color: driverColor }]

    return (
      <g>
        {lines.map((o, idx) => {
          const len = lineLen(o.points)
          const head = headAt(o.points)
          return (
            <g key={idx}>
              <path
                d={linePath(o.points)}
                fill="none"
                stroke={o.color}
                strokeWidth={separatedGroup ? 2.6 : 3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - r)}
                opacity="0.95"
              />
              {/* leading dot at the pen tip */}
              <circle cx={head.x} cy={head.y} r="5" fill={o.color} opacity="0.25" />
              <circle cx={head.x} cy={head.y} r="3" fill={o.color} />
              <circle cx={head.x} cy={head.y} r="1.4" fill="#ffffff" opacity="0.9" />
            </g>
          )
        })}
      </g>
    )
  }

  // Animated lap playback. Single lap → one speed-coloured car. Head-to-head →
  // both cars race on a shared real-time clock, so the faster lap pulls ahead and
  // reaches the line first (each paced by its own distance/speed profile).
  const renderPlayback = () => {
    if (!telemetry || vizPoints.length < 2 || playbackProgress === null) return null

    // ── Head-to-head ghost race: every car on a shared real-time clock ──
    if (isComparing) {
      const toScreen = (pts: { x: number; y: number; speed: number; distance?: number }[]) =>
        pts.map((p) => ({ x: p.x * POSTER_W, y: p.y * POSTER_H, speed: p.speed, distance: p.distance }))
      // Drive the deviation-amplified lines when we have them, so every car follows its
      // DISTINCT line (not the near-identical raw laps) during the ghost race.
      const racerSrc = separatedGroup
        ? separatedGroup.lines.map((ln, i) => ({
            color: groupColors[i],
            name: i === 0 ? driver?.shortName ?? '' : compareLaps[i - 1].driver.shortName,
            lapSec: parseLapSeconds(i === 0 ? telemetry.lapTime : compareLaps[i - 1].telemetry.lapTime),
            pts: toScreen(ln),
          }))
        : [
            { color: driverColor, name: driver?.shortName ?? '', lapSec: parseLapSeconds(telemetry.lapTime), pts: toScreen(vizPoints) },
            ...compareLaps.map((c) => ({
              color: c.color, name: c.driver.shortName, lapSec: parseLapSeconds(c.telemetry.lapTime), pts: toScreen(c.points),
            })),
          ]
      const racers = racerSrc.map((r) => ({ ...r, tau: lapTimeProfile(r.pts) }))

      const tMax = Math.max(...racers.map((r) => r.lapSec)) || 1
      const realT = playbackProgress * tMax
      const states = racers.map((r) => ({ ...r, head: carAtFraction(r.pts, r.tau, realT / r.lapSec) }))
      const leader = states.reduce((a, b) => (a.lapSec <= b.lapSec ? a : b))

      const fullLine = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      const trailTo = (pts: { x: number; y: number }[], head: { x: number; y: number; idx: number }) =>
        pts.slice(0, head.idx + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
        ` L ${head.x.toFixed(1)} ${head.y.toFixed(1)}`

      return (
        <g>
          {/* faint full laps */}
          {states.map((s, i) => (
            <path key={`f${i}`} d={fullLine(s.pts)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
          ))}
          {/* trails + cars (compares first, primary drawn last so it sits on top) */}
          {[...states].reverse().map((s, i) => (
            <g key={`c${i}`}>
              <path d={trailTo(s.pts, s.head)} fill="none" stroke={s.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
              <circle cx={s.head.x} cy={s.head.y} r="8" fill={s.color} opacity="0.25" />
              <circle cx={s.head.x} cy={s.head.y} r="4.5" fill={s.color} />
              <circle cx={s.head.x} cy={s.head.y} r="2" fill="#ffffff" opacity="0.9" />
            </g>
          ))}
          {/* who's ahead — chip in a track-free corner */}
          {(() => {
            const bw = 86, bh = 22
            const box = cornerForBox(bw, bh)
            return (
              <g>
                <rect x={box.x} y={box.y} width={bw} height={bh} rx="5" fill={theme.bg} opacity="0.9" />
                <text x={box.x + bw - 8} y={box.y + 15} textAnchor="end" fill={leader.color} fontSize="13" fontFamily="monospace" fontWeight="700">
                  {leader.name} ▲
                </text>
              </g>
            )
          })()}
        </g>
      )
    }

    // ── Single car: trail coloured by throttle/brake ──
    // The car paints the lap as it drives it — green when on the throttle, amber on
    // a lift/coast, red into the braking zones (throttle is 0..100, brake 0..1).
    // In 'Racing Line' mode the car drives the IDEAL line that's drawn (with the real
    // speed/throttle/brake carried onto it); otherwise it drives the telemetry path.
    const useRacingLine = !!racingLinePoints && !isComparing
    const base = useRacingLine
      ? attrsAlongGeometry(racingLinePoints!, vizPoints)
      : vizPoints.map((p) => ({ x: p.x, y: p.y, speed: p.speed, throttle: p.throttle ?? 0, brake: p.brake ?? 0 }))
    const pts = base.map((p) => ({ x: p.x * POSTER_W, y: p.y * POSTER_H, speed: p.speed, throttle: p.throttle, brake: p.brake }))
    const n = pts.length
    const tbColor = (throttle: number, brake: number) =>
      brake > 0.05
        ? interpolateColor('#ff8c42', '#ff2020', Math.min(1, brake))            // lift-off → hard braking
        : interpolateColor('#ffce3a', '#27e06b', Math.min(1, throttle / 100))   // coasting → full throttle

    // Head position. The racing line is sampled by distance (not time), so pace it by
    // the speed profile (slow in corners); the telemetry path keeps its linear index.
    let headIdx: number, hx: number, hy: number, hSpeed: number, hThrottle: number, hBrake: number
    if (useRacingLine) {
      const tau = lapTimeProfile(pts)
      const h = carAtFraction(pts, tau, playbackProgress)
      headIdx = h.idx; hx = h.x; hy = h.y; hSpeed = h.speed
      hThrottle = pts[headIdx].throttle; hBrake = pts[headIdx].brake
    } else {
      const headF = playbackProgress * (n - 1)
      headIdx = Math.min(n - 1, Math.floor(headF))
      const frac = headF - headIdx
      const a = pts[headIdx]
      const b = pts[Math.min(n - 1, headIdx + 1)]
      hx = a.x + (b.x - a.x) * frac
      hy = a.y + (b.y - a.y) * frac
      hSpeed = a.speed + (b.speed - a.speed) * frac
      hThrottle = a.throttle + (b.throttle - a.throttle) * frac
      hBrake = a.brake + (b.brake - a.brake) * frac
    }
    const carColor = tbColor(hThrottle, hBrake)
    const phase = hBrake > 0.05 ? 'BRAKING' : hThrottle > 95 ? 'FULL THROTTLE' : 'LIFT'

    const fullPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    // Trail as per-point segments so the colour tracks throttle/brake along the lap.
    const segs: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
    for (let i = 1; i <= headIdx; i++) {
      segs.push({ x1: pts[i - 1].x, y1: pts[i - 1].y, x2: pts[i].x, y2: pts[i].y, color: tbColor(pts[i - 1].throttle, pts[i - 1].brake) })
    }
    segs.push({ x1: pts[headIdx].x, y1: pts[headIdx].y, x2: hx, y2: hy, color: tbColor(pts[headIdx].throttle, pts[headIdx].brake) })

    // Readout chip, placed in whichever circuit-area corner is clear of the track.
    const boxW = 118, boxH = 40
    const box = cornerForBox(boxW, boxH)

    return (
      <g>
        <path d={fullPath} fill="none" stroke={driverColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
        {segs.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
        ))}
        <circle cx={hx} cy={hy} r="9" fill={carColor} opacity="0.25" />
        <circle cx={hx} cy={hy} r="4.5" fill={carColor} />
        <circle cx={hx} cy={hy} r="2" fill="#ffffff" opacity="0.85" />
        {/* throttle/brake phase + speed readout — on a chip in a track-free corner */}
        <g>
          <rect x={box.x} y={box.y} width={boxW} height={boxH} rx="5" fill={theme.bg} opacity="0.9" />
          <text x={box.x + boxW - 8} y={box.y + 16} textAnchor="end" fill={carColor} fontSize="12" fontFamily="monospace" fontWeight="700" letterSpacing="1.5">
            {phase}
          </text>
          <text x={box.x + boxW - 8} y={box.y + 33} textAnchor="end" fill={theme.textColor} fontSize="16" fontFamily="monospace" fontWeight="700">
            {Math.round(hSpeed)} km/h
          </text>
        </g>
      </g>
    )
  }

  const statsY = CIRCUIT_AREA.y + CIRCUIT_AREA.h + 10

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ width: POSTER_W, height: POSTER_H, flexShrink: 0 }}
    >
      <svg
        ref={svgRef}
        id="poster-svg"
        width={POSTER_W}
        height={POSTER_H}
        viewBox={`0 0 ${POSTER_W} ${POSTER_H}`}
        style={{ display: 'block', borderRadius: '8px', overflow: 'hidden' }}
      >
        {/* Background */}
        <rect width={POSTER_W} height={POSTER_H} fill={theme.bg} />
        <rect
          width={POSTER_W}
          height={POSTER_H}
          fill={`url(#bgGradient)`}
          opacity="0.4"
        />
        {/* Surface texture — distinguishes themes by material, not just colour */}
        {theme.texture === 'carbon' && <rect width={POSTER_W} height={POSTER_H} fill="url(#texCarbon)" />}
        {theme.texture === 'grid' && <rect width={POSTER_W} height={POSTER_H} fill="url(#texGrid)" />}
        {theme.texture === 'grain' && <rect width={POSTER_W} height={POSTER_H} filter="url(#texGrain)" opacity="0.06" />}
        {theme.texture === 'paper' && <rect width={POSTER_W} height={POSTER_H} filter="url(#texPaper)" opacity="0.5" />}

        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={theme.accentGlow.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')')} stopOpacity="0.12" />
            <stop offset="100%" stopColor={theme.bg} stopOpacity="0" />
          </radialGradient>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Carbon twill — faint diagonal weave */}
          <pattern id="texCarbon" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="8" fill="#ffffff" opacity="0.022" />
          </pattern>
          {/* Blueprint grid — drawn in the primary line colour */}
          <pattern id="texGrid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke={theme.primaryLine} strokeWidth="0.5" opacity="0.12" />
          </pattern>
          {/* Film grain — light specks for dark themes */}
          <filter id="texGrain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0" />
          </filter>
          {/* Paper fibre — dark specks for the light theme */}
          <filter id="texPaper" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0.6 0" />
          </filter>
        </defs>

        {/* Top accent line */}
        <line x1="0" y1="0" x2={POSTER_W} y2="0" stroke={theme.primaryLine} strokeWidth="2" opacity="0.6" />

        {/* Header */}
        <text
          x={POSTER_W / 2}
          y="26"
          textAnchor="middle"
          fill={theme.textColor}
          opacity="0.85"
          fontSize="11"
          fontFamily="var(--font-inter), system-ui, sans-serif"
          letterSpacing="4"
          fontWeight="600"
        >
          F1RACESIGNATURE.SITE
        </text>
        <text
          x={POSTER_W / 2}
          y="54"
          textAnchor="middle"
          fill={theme.textColor}
          fontSize="28"
          fontFamily={theme.displayFont}
          fontStyle="italic"
          letterSpacing="1"
        >
          {isComparing && driver
            ? [driver.shortName, ...compareLaps.map((c) => c.driver.shortName)].join(' vs ')
            : driver?.name ?? 'Select a Driver'}
        </text>

        {/* Badge — viz mode, plus HEAD TO HEAD when comparing, so the label always
            reflects what's actually on screen (e.g. "RACING LINE · HEAD TO HEAD"). */}
        {(() => {
          const modeName = (VIZ_MODES.find((v) => v.id === vizMode)?.name ?? vizMode).toUpperCase()
          const label = isComparing ? `${modeName} · HEAD TO HEAD` : modeName
          const badgeW = label.length * 7.4 + 30
          return (
            <g transform={`translate(${POSTER_W / 2 - badgeW / 2}, 66)`}>
              <rect width={badgeW} height="18" rx="4" fill={theme.primaryLine} opacity="0.16" />
              <rect width={badgeW} height="18" rx="4" fill="none" stroke={theme.primaryLine} strokeWidth="0.5" opacity="0.3" />
              <text x={badgeW / 2} y="12.5" textAnchor="middle" fill={theme.primaryLine}
                fontSize="11" fontFamily="monospace" letterSpacing="2" opacity="1">
                {label}
              </text>
            </g>
          )
        })()}

        {/* Circuit area — real to-scale OSM track, the circuits.json outline, or (for
            real GPS laps with no matching outline, incl. head-to-head real lines)
            a ribbon built from the lap itself */}
        {separatedGroup
          ? <PairRibbon pts={separatedGroup.center} />
          : h2hRealLine
            ? <LineRibbon pts={vizPoints} />
            : realTrackPath
              ? <RealTrackRibbon path={realTrackPath} fit={fit} widthPx={REAL_RIBBON_PX} />
              : circuitPath
                ? <CircuitBackground path={circuitPath} fit={fit} />
                : <LineRibbon pts={vizPoints} />}

        {/* Visualization overlay — playback when playing, draw-on reveal while the
            line is still drawing itself, otherwise the settled static viz */}
        {isPlaying ? renderPlayback() : reveal !== null ? renderReveal() : renderViz()}

        {/* Compare legend — every driver, year, lap time + fastest margin */}
        {isComparing && driver && telemetry && (() => {
          const rowH = 28
          const rows = [
            { name: driver.shortName, year: race?.year, lapTime: telemetry.lapTime, color: driverColor, sec: parseLapSeconds(telemetry.lapTime) },
            ...compareLaps.map((c) => ({
              name: c.driver.shortName, year: c.race?.year, lapTime: c.telemetry.lapTime, color: c.color, sec: parseLapSeconds(c.telemetry.lapTime),
            })),
          ]
          const sorted = [...rows].sort((a, b) => a.sec - b.sec)
          const fastestSec = sorted[0].sec
          const gap = sorted.length > 1 ? sorted[1].sec - sorted[0].sec : 0
          const footer = sorted.length > 1 ? `${sorted[0].name} fastest by ${gap.toFixed(3)}s` : ''
          const panelW = 194
          const panelH = 30 + rows.length * rowH

          // Place the panel in a corner the track outline doesn't reach, so it never
          // overlaps the circuit (tracks are roughly oval → a corner is usually free).
          // Tested against the actual track points; preference order favours the
          // lower-left, sitting just above the bottom watermark.
          const trackPts: { x: number; y: number }[] = []
          if (geomPath) {
            const nums = geomPath.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
            for (let i = 0; i + 1 < nums.length; i += 2) {
              const p = rotatePathCoord(nums[i], nums[i + 1], rot)
              trackPts.push({ x: p.x * fit.scale + fit.tx, y: p.y * fit.scale + fit.ty })
            }
          } else {
            for (const p of vizPoints) trackPts.push({ x: p.x * POSTER_W, y: p.y * POSTER_H })
          }
          const areaL = CIRCUIT_AREA.x, areaR = CIRCUIT_AREA.x + CIRCUIT_AREA.w
          const areaT = CIRCUIT_AREA.y, areaB = CIRCUIT_AREA.y + CIRCUIT_AREA.h
          const wmReserve = 16 // keep clear of the bottom-left watermark
          // Candidates in preference order: bottom-left, top-left, bottom-right, top-right.
          const candidates = [
            { boxLeft: areaL, boxTop: areaB - wmReserve - panelH },
            { boxLeft: areaL, boxTop: areaT },
            { boxLeft: areaR - panelW, boxTop: areaB - wmReserve - panelH },
            { boxLeft: areaR - panelW, boxTop: areaT },
          ]
          const PAD = 18 // clearance for the track ribbon's half-stroke
          const hits = (c: { boxLeft: number; boxTop: number }) =>
            trackPts.filter((p) =>
              p.x >= c.boxLeft - PAD && p.x <= c.boxLeft + panelW + PAD &&
              p.y >= c.boxTop - PAD && p.y <= c.boxTop + panelH + PAD).length
          // Stable sort keeps the preference order on ties (e.g. several clear corners).
          const bestCorner = candidates.map((c) => ({ c, n: hits(c) })).sort((a, b) => a.n - b.n)[0]
          // Most tracks leave a clear corner → use it (preserves the lower-left bias).
          // But tracks that fill the whole fit area (portrait circuits rotated to
          // landscape — Interlagos, etc.) occupy every corner, so the panel would
          // sit on the ribbon. Then scan the area for the least-occupied position,
          // tie-broken toward the preferred bottom-left, so it tucks into an
          // infield/edge gap instead of overlapping the track.
          let best = bestCorner.c
          if (bestCorner.n > 0) {
            const blAnchor = { x: areaL, y: areaB - wmReserve - panelH }
            let chosen: { score: number; c: { boxLeft: number; boxTop: number } } | null = null
            for (let bl = areaL; bl <= areaR - panelW; bl += 16) {
              for (let bt = areaT; bt <= areaB - wmReserve - panelH; bt += 16) {
                const c = { boxLeft: bl, boxTop: bt }
                const score = hits(c) * 1e6 + Math.hypot(bl - blAnchor.x, bt - blAnchor.y)
                if (!chosen || score < chosen.score) chosen = { score, c }
              }
            }
            if (chosen) best = chosen.c
          }
          const lx = best.boxLeft + 8
          const ly = best.boxTop + 14
          return (
            <g fontFamily="monospace">
              <rect x={lx - 8} y={ly - 14} width={panelW} height={panelH} rx="6" fill={theme.bg} opacity="0.97" />
              <rect x={lx - 8} y={ly - 14} width={panelW} height={panelH} rx="6" fill="none" stroke={theme.borderColor} strokeWidth="1" opacity="0.6" />
              {rows.map((r, i) => (
                <g key={i}>
                  <circle cx={lx + 6} cy={ly + 4 + i * rowH} r="6" fill={r.color} />
                  <text x={lx + 20} y={ly + 9 + i * rowH} fill={theme.textColor} fontSize="15">{r.name}{r.year ? ` ’${String(r.year).slice(2)}` : ''}</text>
                  <text x={lx + panelW - 18} y={ly + 9 + i * rowH} textAnchor="end" fill={r.color} fontSize="15" fontWeight={r.sec === fastestSec ? 700 : 600}>{r.lapTime}</text>
                </g>
              ))}
              {footer && (
                <text x={lx + panelW - 18} y={ly + 5 + rows.length * rowH} textAnchor="end" fill={theme.fastColor} fontSize="11">{footer}</text>
              )}
            </g>
          )
        })()}

        {/* ── Stats section ── */}
        {(() => {
          const L = CIRCUIT_AREA.x
          const R = CIRCUIT_AREA.x + CIRCUIT_AREA.w
          const W = CIRCUIT_AREA.w
          const y0 = statsY

          return (
            <>
              {/* Divider 1 */}
              <line x1={L} y1={y0 - 10} x2={R} y2={y0 - 10} stroke={theme.borderColor} strokeWidth="1" opacity="0.5" />

              {/* — Row 1: Lap time + nationality/team — */}
              <text x={L} y={y0 + 2} fill={theme.textColor} opacity="0.8" fontSize="9" fontFamily="monospace" letterSpacing="3">FLYING LAP</text>
              {driver && (
                <text x={R} y={y0 + 2} textAnchor="end" fill={theme.textColor} opacity="0.6" fontSize="9" fontFamily="monospace" letterSpacing="2">
                  {(histTeam?.team ?? driver.team).toUpperCase()}
                </text>
              )}
              <text x={L} y={y0 + 40} fill={theme.primaryLine} fontSize="42" fontFamily="monospace" fontWeight="700" letterSpacing="2">
                {telemetry?.lapTime ?? '—:——.———'}
              </text>
              {driver && (
                <text x={R} y={y0 + 40} textAnchor="end" fill={theme.textColor} fontSize="20" fontFamily={theme.displayFont} fontStyle="italic">
                  {driver.shortName}
                </text>
              )}

              {/* Divider 2 */}
              <line x1={L} y1={y0 + 46} x2={R} y2={y0 + 46} stroke={theme.borderColor} strokeWidth="1" opacity="0.4" />

              {/* — Row 2: Sector times — */}
              {telemetry && (() => {
                const colW = W / 3
                const secTimes = (t: Telemetry) => [t.sectors.s1Time, t.sectors.s2Time, t.sectors.s3Time]
                // Fastest time in each sector across every racer (main + compares).
                const fastestSec = [0, 1, 2].map((i) =>
                  Math.min(...[telemetry, ...compareLaps.map((c) => c.telemetry)].map((t) => secTimes(t)[i])))
                const sectors = [
                  { label: 'SECTOR 1', val: telemetry.sectors.s1Time.toFixed(3) + 's', color: theme.s1Color },
                  { label: 'SECTOR 2', val: telemetry.sectors.s2Time.toFixed(3) + 's', color: theme.s2Color },
                  { label: 'SECTOR 3', val: telemetry.sectors.s3Time.toFixed(3) + 's', color: theme.s3Color },
                ]
                return sectors.map((s, i) => {
                  // In compare mode, mark the sectors the main driver won.
                  const won = isComparing && Math.abs(secTimes(telemetry)[i] - fastestSec[i]) < 1e-6
                  return (
                    <g key={i}>
                      <rect x={L + i * colW} y={y0 + 50} width={colW - 4} height="38" rx="3" fill={won ? '#00e676' : s.color} opacity={won ? 0.1 : 0.06} />
                      <text x={L + i * colW + 8} y={y0 + 63} fill={theme.textColor} opacity="0.65" fontSize="9" fontFamily="monospace" letterSpacing="2">{s.label}</text>
                      <text x={L + i * colW + 8} y={y0 + 81} fill={s.color} fontSize="18" fontFamily="monospace" fontWeight="700">{s.val}</text>
                      {won && <circle cx={L + i * colW + colW - 14} cy={y0 + 60} r="3" fill="#00e676" />}
                    </g>
                  )
                })
              })()}

              {/* Divider 3 */}
              <line x1={L} y1={y0 + 96} x2={R} y2={y0 + 96} stroke={theme.borderColor} strokeWidth="1" opacity="0.4" />

              {/* — Row 3: Speed stats grid — */}
              {telemetry && (() => {
                // In compare mode the BENCHMARK slot becomes the gap to the fastest rival.
                const fastestRival = isComparing && compareLaps.length > 0
                  ? Math.min(...compareLaps.map((c) => parseLapSeconds(c.telemetry.lapTime)))
                  : null
                const gap = fastestRival !== null ? parseLapSeconds(telemetry.lapTime) - fastestRival : null
                const stats = [
                  { label: 'TOP SPEED',  val: `${telemetry.topSpeed} km/h`, color: theme.textColor },
                  { label: 'AVG SPEED',  val: `${telemetry.averageSpeed} km/h`, color: theme.textColor },
                  { label: 'SAMPLES',    val: `${telemetry.points.length} pts`, color: theme.textColor },
                  gap !== null
                    ? {
                        label: 'GAP',
                        val: `${gap > 0.0005 ? '+' : gap < -0.0005 ? '−' : ''}${Math.abs(gap).toFixed(3)}s`,
                        color: gap > 0.0005 ? '#ff4444' : gap < -0.0005 ? '#00e676' : theme.textColor,
                      }
                    : { label: 'BENCHMARK', val: telemetry.benchmarkLapTime, color: theme.textColor },
                ]
                const colW = W / 4
                return stats.map((s, i) => (
                  <g key={i}>
                    <text x={L + i * colW + colW / 2} y={y0 + 110} textAnchor="middle" fill={theme.textColor} opacity="0.6" fontSize="9" fontFamily="monospace" letterSpacing="1.2">{s.label}</text>
                    <text x={L + i * colW + colW / 2} y={y0 + 127} textAnchor="middle" fill={s.color} fontSize="16" fontFamily="monospace" fontWeight="600">{s.val}</text>
                  </g>
                ))
              })()}

              {/* Divider 4 */}
              <line x1={L} y1={y0 + 136} x2={R} y2={y0 + 136} stroke={theme.borderColor} strokeWidth="1" opacity="0.4" />

              {/* — Row 4: Circuit name + description — */}
              <text x={L} y={y0 + 152} fill={theme.primaryLine} fontSize="14" fontFamily="monospace" letterSpacing="2">
                {race ? race.circuitName.toUpperCase() : 'SELECT A RACE'}
              </text>
              <text x={R} y={y0 + 152} textAnchor="end" fill={theme.textColor} opacity="0.7" fontSize="12" fontFamily="monospace" letterSpacing="1">
                {race?.year ?? ''}
              </text>
              {race && (
                <text x={L} y={y0 + 167} fill={theme.textColor} opacity="0.7" fontSize="12" fontFamily="Georgia, serif" fontStyle="italic">
                  {race.location}
                </text>
              )}

              {/* — Row 5: Driver bio snippet — */}
              {driver && (
                <>
                  <line x1={L} y1={y0 + 178} x2={R} y2={y0 + 178} stroke={theme.borderColor} strokeWidth="1" opacity="0.3" />
                  {wrapText(driver.bio, 56).slice(0, 2).map((line, i) => (
                    <text key={i} x={L} y={y0 + 193 + i * 15} fill={theme.textColor} fontSize="11"
                      fontFamily="Georgia, serif" fontStyle="italic" opacity="0.65">{line}</text>
                  ))}
                </>
              )}

              {/* Bottom branding */}
              <line x1={L} y1={POSTER_H - 28} x2={R} y2={POSTER_H - 28} stroke={theme.borderColor} strokeWidth="1" opacity="0.35" />
              <text x={L} y={POSTER_H - 12} fill={theme.textDim} fontSize="10" fontFamily="monospace" letterSpacing="4" opacity="0.6">WHERE SPEED BECOMES ART</text>
              <text x={R} y={POSTER_H - 12} textAnchor="end" fill={theme.primaryLine} fontSize="10" fontFamily="monospace" letterSpacing="2" opacity="0.9">F1RACESIGNATURE.SITE</text>
            </>
          )
        })()}

        {/* Bottom accent line */}
        <line x1="0" y1={POSTER_H - 1} x2={POSTER_W} y2={POSTER_H - 1} stroke={theme.primaryLine} strokeWidth="2" opacity="0.4" />

        {/* Free tier watermark */}
        {isFreeTier && <Watermark theme={theme} />}
      </svg>
    </motion.div>
  )
}
