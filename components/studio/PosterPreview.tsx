'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Driver, Race, Telemetry, Circuit, ThemeConfig, VizMode } from '@/lib/types'
import { RacingLine } from '@/components/visualizations/RacingLine'
import { SpeedHeatmap } from '@/components/visualizations/SpeedHeatmap'
import { SectorSplit } from '@/components/visualizations/SectorSplit'
import { OvertakeMap } from '@/components/visualizations/OvertakeMap'
import { VIZ_MODES } from '@/lib/themes'
import { interpolateColor, distinctColors } from '@/lib/data'
import { teamAtYear } from '@/lib/driverTeams'

const POSTER_W = 720
const POSTER_H = 800
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
        {/* Centre dashed line */}
        <path d={path} fill="none" stroke="#888888" strokeWidth={sw(1.6)} strokeLinecap="round" strokeLinejoin="round" opacity="0.35" strokeDasharray={`${sw(9)} ${sw(9)}`} />
      </g>
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
}: PosterPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const isPlaying = playbackProgress !== null

  // Auto-orient portrait tracks to landscape, in path space (outline + telemetry alike).
  // A manual override wins when present (diagonal tracks the bbox rule can't read).
  const rot = (() => {
    if (circuit) return CIRCUIT_ROTATION[circuit.id] ?? landscapeRotation(pathBounds(circuit.path))
    if (telemetry && telemetry.points.length > 1) {
      const xs = telemetry.points.map((p) => p.x)
      const ys = telemetry.points.map((p) => p.y)
      return landscapeRotation({ x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) })
    }
    return 0
  })()
  const circuitPath = circuit ? rotatePath(circuit.path, rot) : null

  // The one fit shared by the outline (via CircuitBackground) and the racing
  // line below — computed once so the two paths can never diverge.
  const fit = computeCircuitFit(fitBounds(circuitPath, telemetry, rot))

  const toPosterSpace = (tel: Telemetry | null) =>
    tel?.points.map((pt) => {
      // Path space (0..PATH_VB) → rotate → screen via the shared fit → poster 0-1.
      const p = rotatePathCoord(pt.x * PATH_VB.w, pt.y * PATH_VB.h, rot)
      return {
        ...pt,
        x: (p.x * fit.scale + fit.tx) / POSTER_W,
        y: (p.y * fit.scale + fit.ty) / POSTER_H,
      }
    }) ?? []

  // Map raw 0-1 telemetry coords into poster-space 0-1
  // Viz components then multiply by POSTER_W/H to get final pixels.
  const vizPoints = toPosterSpace(telemetry)

  // Historical livery: when the shown driver matches the race's driver, use the
  // team they actually raced for that year (e.g. Hamilton/Silverstone 2020 = Mercedes).
  const lapColor = (d: Driver, r: Race | null) =>
    (r && r.driverId === d.id ? teamAtYear(d.id, r.year)?.color : null) ?? d.color ?? theme.fastColor
  const histTeam = driver && race && race.driverId === driver.id ? teamAtYear(driver.id, race.year) : null
  const driverBase = histTeam?.color ?? driver?.color ?? theme.primaryLine

  // Up to two head-to-head laps, each with its racing line (poster space) + livery colour.
  const compareBase = compares
    .filter((c) => c.driver && c.telemetry && c.telemetry.points.length > 1)
    .map((c) => ({
      driver: c.driver!,
      race: c.race,
      telemetry: c.telemetry!,
      points: toPosterSpace(c.telemetry),
      baseColor: lapColor(c.driver!, c.race),
    }))
  // Keep every racer's colour distinct (two same-team drivers would otherwise clash).
  const palette = distinctColors([driverBase, ...compareBase.map((c) => c.baseColor)])
  const driverColor = palette[0]
  const compareLaps = compareBase.map((c, i) => ({ ...c, color: palette[i + 1] }))
  const isComparing = compareLaps.length > 0

  const renderViz = () => {
    if (!telemetry || vizPoints.length === 0) return null

    // ── Compare mode ──
    if (isComparing) {
      // Exactly one compare lap → speed-delta map (segments coloured by who's faster).
      if (compareLaps.length === 1) {
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

      // Two compare laps (three total) → overlay each racing line in its team colour.
      const linePath = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x * POSTER_W).toFixed(1)} ${(p.y * POSTER_H).toFixed(1)}`).join(' ')
      const overlay = [{ points: vizPoints, color: driverColor }, ...compareLaps]
      return (
        <g>
          {overlay.map((o, i) => (
            <g key={i}>
              <path d={linePath(o.points)} fill="none" stroke={o.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
            </g>
          ))}
        </g>
      )
    }

    const props = { points: vizPoints, theme, width: POSTER_W, height: POSTER_H, driverColor }

    switch (vizMode) {
      case 'racing_line':   return <RacingLine {...props} />
      case 'speed_heatmap': return <SpeedHeatmap {...props} />
      case 'sector_split':  return <SectorSplit {...props} />
      case 'overtake_map':  return <OvertakeMap {...props} />
      default:              return <RacingLine {...props} />
    }
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
      const racers = [
        { color: driverColor, name: driver?.shortName ?? '', lapSec: parseLapSeconds(telemetry.lapTime), pts: toScreen(vizPoints) },
        ...compareLaps.map((c) => ({
          color: c.color, name: c.driver.shortName, lapSec: parseLapSeconds(c.telemetry.lapTime), pts: toScreen(c.points),
        })),
      ].map((r) => ({ ...r, tau: lapTimeProfile(r.pts) }))

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
          {/* who's ahead */}
          <text x={CIRCUIT_AREA.x + CIRCUIT_AREA.w - 8} y={CIRCUIT_AREA.y + 16} textAnchor="end" fill={leader.color} fontSize="13" fontFamily="monospace" fontWeight="700">
            {leader.name} ▲
          </text>
        </g>
      )
    }

    // ── Single car (speed-coloured) ──
    const pts = vizPoints.map((p) => ({ x: p.x * POSTER_W, y: p.y * POSTER_H, speed: p.speed }))
    const n = pts.length
    const speeds = pts.map((p) => p.speed)
    const minS = Math.min(...speeds)
    const maxS = Math.max(...speeds)

    const headF = playbackProgress * (n - 1)
    const headIdx = Math.min(n - 1, Math.floor(headF))
    const frac = headF - headIdx
    const a = pts[headIdx]
    const b = pts[Math.min(n - 1, headIdx + 1)]
    const hx = a.x + (b.x - a.x) * frac
    const hy = a.y + (b.y - a.y) * frac
    const hSpeed = a.speed + (b.speed - a.speed) * frac
    const t = (hSpeed - minS) / (maxS - minS || 1)
    const carColor = t < 0.5
      ? interpolateColor(theme.slowColor, theme.midColor, t * 2)
      : interpolateColor(theme.midColor, theme.fastColor, (t - 0.5) * 2)

    const fullPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const trail = pts.slice(0, headIdx + 1)
    const trailPath = trail.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ` L ${hx.toFixed(1)} ${hy.toFixed(1)}`

    return (
      <g>
        <path d={fullPath} fill="none" stroke={driverColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
        <path d={trailPath} fill="none" stroke={carColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        <circle cx={hx} cy={hy} r="9" fill={carColor} opacity="0.25" />
        <circle cx={hx} cy={hy} r="4.5" fill={carColor} />
        <circle cx={hx} cy={hy} r="2" fill="#ffffff" opacity="0.85" />
        {/* speed readout */}
        <text x={CIRCUIT_AREA.x + CIRCUIT_AREA.w - 8} y={CIRCUIT_AREA.y + 16} textAnchor="end" fill={carColor} fontSize="16" fontFamily="monospace" fontWeight="700">
          {Math.round(hSpeed)} km/h
        </text>
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

        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={theme.accentGlow.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')')} stopOpacity="0.12" />
            <stop offset="100%" stopColor={theme.bg} stopOpacity="0" />
          </radialGradient>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
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
          fontFamily="Georgia, serif"
          fontStyle="italic"
          letterSpacing="1"
        >
          {isComparing && driver
            ? [driver.shortName, ...compareLaps.map((c) => c.driver.shortName)].join(' vs ')
            : driver?.name ?? 'Select a Driver'}
        </text>

        {/* Badge — viz mode, or HEAD TO HEAD when comparing */}
        {(() => {
          const label = isComparing
            ? 'HEAD TO HEAD'
            : (VIZ_MODES.find((v) => v.id === vizMode)?.name ?? vizMode).toUpperCase()
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

        {/* Circuit area */}
        {circuitPath && <CircuitBackground path={circuitPath} fit={fit} />}

        {/* Visualization overlay — or animated playback when playing */}
        {isPlaying ? renderPlayback() : renderViz()}

        {/* Compare legend — every driver, year, lap time + fastest margin */}
        {isComparing && driver && telemetry && (() => {
          const rowH = 18
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
          const panelW = 130
          const panelH = 22 + rows.length * rowH

          // Place the panel in a corner the track outline doesn't reach, so it never
          // overlaps the circuit (tracks are roughly oval → a corner is usually free).
          // Tested against the actual track points; preference order favours the
          // lower-left, sitting just above the bottom watermark.
          const trackPts: { x: number; y: number }[] = []
          if (circuit) {
            const nums = circuit.path.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
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
          const best = candidates.map((c) => ({ c, n: hits(c) })).sort((a, b) => a.n - b.n)[0].c
          const lx = best.boxLeft + 8
          const ly = best.boxTop + 12
          return (
            <g fontFamily="monospace">
              <rect x={lx - 8} y={ly - 12} width="130" height={panelH} rx="6" fill={theme.bg} opacity="0.92" />
              <rect x={lx - 8} y={ly - 12} width="130" height={panelH} rx="6" fill="none" stroke={theme.borderColor} strokeWidth="1" opacity="0.6" />
              {rows.map((r, i) => (
                <g key={i}>
                  <circle cx={lx + 4} cy={ly + 2 + i * rowH} r="4" fill={r.color} />
                  <text x={lx + 14} y={ly + 5 + i * rowH} fill={theme.textColor} fontSize="10">{r.name}{r.year ? ` ’${String(r.year).slice(2)}` : ''}</text>
                  <text x={lx + 112} y={ly + 5 + i * rowH} textAnchor="end" fill={r.color} fontSize="10" fontWeight={r.sec === fastestSec ? 700 : 600}>{r.lapTime}</text>
                </g>
              ))}
              {footer && (
                <text x={lx + 112} y={ly + 2 + rows.length * rowH} textAnchor="end" fill={theme.fastColor} fontSize="8">{footer}</text>
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
                <text x={R} y={y0 + 40} textAnchor="end" fill="#ffffff" fontSize="20" fontFamily="Georgia, serif" fontStyle="italic">
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
                  { label: 'TOP SPEED',  val: `${telemetry.topSpeed} km/h`, color: '#ffffff' },
                  { label: 'AVG SPEED',  val: `${telemetry.averageSpeed} km/h`, color: '#ffffff' },
                  { label: 'SAMPLES',    val: `${telemetry.points.length} pts`, color: '#ffffff' },
                  gap !== null
                    ? {
                        label: 'GAP',
                        val: `${gap > 0.0005 ? '+' : gap < -0.0005 ? '−' : ''}${Math.abs(gap).toFixed(3)}s`,
                        color: gap > 0.0005 ? '#ff4444' : gap < -0.0005 ? '#00e676' : '#ffffff',
                      }
                    : { label: 'BENCHMARK', val: telemetry.benchmarkLapTime, color: '#ffffff' },
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
