'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Driver, Race, Telemetry, Circuit, ThemeConfig, VizMode } from '@/lib/types'
import { RacingLine } from '@/components/visualizations/RacingLine'
import { SpeedHeatmap } from '@/components/visualizations/SpeedHeatmap'
import { SectorSplit } from '@/components/visualizations/SectorSplit'
import { OvertakeMap } from '@/components/visualizations/OvertakeMap'
import { VIZ_MODES } from '@/lib/themes'
import { interpolateColor } from '@/lib/data'

const POSTER_W = 600
const POSTER_H = 800
const CIRCUIT_AREA = { x: 40, y: 88, w: 520, h: 452 }

interface PosterPreviewProps {
  driver: Driver | null
  race: Race | null
  telemetry: Telemetry | null
  circuit: Circuit | null
  theme: ThemeConfig
  vizMode: VizMode
  isFreeTier?: boolean
  // Head-to-head comparison (second lap on the same circuit)
  compareDriver?: Driver | null
  compareTelemetry?: Telemetry | null
  // Lap playback: 0..1 progress, or null when not playing
  playbackProgress?: number | null
}

function parseLapSeconds(s: string): number {
  const [m, sec] = s.split(':')
  return parseInt(m) * 60 + parseFloat(sec)
}

function CircuitBackground({ circuit, theme }: { circuit: Circuit; theme: ThemeConfig }) {
  const scaleX = CIRCUIT_AREA.w / 500
  const scaleY = CIRCUIT_AREA.h / 420

  return (
    <g>
      <g transform={`translate(${CIRCUIT_AREA.x}, ${CIRCUIT_AREA.y}) scale(${scaleX}, ${scaleY})`}>
        {/* Outer kerb / run-off glow */}
        <path d={circuit.path} fill="none" stroke="#ffffff" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" opacity="0.05" />
        {/* White curb border */}
        <path d={circuit.path} fill="none" stroke="#ffffff" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" opacity="0.08" />
        {/* Asphalt track surface */}
        <path d={circuit.path} fill="none" stroke="#3a3a3a" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        {/* Track highlight edge */}
        <path d={circuit.path} fill="none" stroke="#606060" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        {/* Centre dashed line */}
        <path d={circuit.path} fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" strokeDasharray="8 8" />
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
    <g transform={`translate(${POSTER_W / 2}, ${POSTER_H / 2}) rotate(-35)`}>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.textColor}
        fontSize="22"
        fontFamily="Georgia, serif"
        letterSpacing="12"
        opacity="0.04"
        fontStyle="italic"
      >
        F1RACESIGNATURE FREE
      </text>
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
  compareDriver = null,
  compareTelemetry = null,
  playbackProgress = null,
}: PosterPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const isComparing = Boolean(compareTelemetry && compareTelemetry.points.length > 1)
  const isPlaying = playbackProgress !== null

  const toPosterSpace = (tel: Telemetry | null) =>
    tel?.points.map((pt) => ({
      ...pt,
      x: (pt.x * CIRCUIT_AREA.w + CIRCUIT_AREA.x) / POSTER_W,
      y: (pt.y * CIRCUIT_AREA.h + CIRCUIT_AREA.y) / POSTER_H,
    })) ?? []

  // Map raw 0-1 telemetry coords into poster-space 0-1
  // Viz components then multiply by POSTER_W/H to get final pixels.
  const vizPoints = toPosterSpace(telemetry)
  const comparePoints = toPosterSpace(compareTelemetry)

  const driverColor = driver?.color ?? theme.primaryLine
  const compareColor = compareDriver?.color ?? theme.fastColor

  const renderViz = () => {
    if (!telemetry || vizPoints.length === 0) return null

    // In compare mode: render a speed-delta map.
    // The circuit is coloured segment-by-segment based on who was faster at
    // each point. One overlapping line engulfs the other, so we never do that.
    if (isComparing && comparePoints.length > 1) {
      const n = Math.min(vizPoints.length, comparePoints.length)

      // Full circuit base (dark road surface so segments pop)
      const basePath = vizPoints.slice(0, n).map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${(p.x * POSTER_W).toFixed(1)} ${(p.y * POSTER_H).toFixed(1)}`
      ).join(' ')

      // Group consecutive points by which driver is faster into coloured runs
      type Seg = { d: string; d1: boolean }
      const segs: Seg[] = []
      const faster = (i: number) => vizPoints[i].speed >= comparePoints[i].speed
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
          {/* Base road */}
          <path d={basePath} fill="none" stroke="#1e1e1e" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          {segs.map((s, i) => {
            const color = s.d1 ? driverColor : compareColor
            return (
              <g key={i}>
                {/* Glow halo */}
                <path d={s.d} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" />
                {/* Crisp line */}
                <path d={s.d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
              </g>
            )
          })}
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

  // Animated lap playback: faint full line + bright trail + speed-coloured car
  const renderPlayback = () => {
    if (!telemetry || vizPoints.length < 2 || playbackProgress === null) return null
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

  const statsY = CIRCUIT_AREA.y + CIRCUIT_AREA.h + 20

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
          y="30"
          textAnchor="middle"
          fill={theme.textDim}
          fontSize="9"
          fontFamily="var(--font-inter), system-ui, sans-serif"
          letterSpacing="4"
          fontWeight="500"
        >
          F1RACESIGNATURE
        </text>
        <text
          x={POSTER_W / 2}
          y="50"
          textAnchor="middle"
          fill={theme.textColor}
          fontSize="22"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          letterSpacing="1"
        >
          {isComparing && compareDriver
            ? `${driver?.shortName ?? ''} vs ${compareDriver.shortName}`
            : driver?.name ?? 'Select a Driver'}
        </text>

        {/* Badge — viz mode, or HEAD TO HEAD when comparing */}
        {(() => {
          const label = isComparing
            ? 'HEAD TO HEAD'
            : (VIZ_MODES.find((v) => v.id === vizMode)?.name ?? vizMode).toUpperCase()
          const badgeW = label.length * 6.2 + 24
          return (
            <g transform={`translate(${POSTER_W / 2 - badgeW / 2}, 56)`}>
              <rect width={badgeW} height="14" rx="3" fill={theme.primaryLine} opacity="0.12" />
              <rect width={badgeW} height="14" rx="3" fill="none" stroke={theme.primaryLine} strokeWidth="0.5" opacity="0.3" />
              <text x={badgeW / 2} y="10" textAnchor="middle" fill={theme.primaryLine}
                fontSize="7" fontFamily="monospace" letterSpacing="2" opacity="0.9">
                {label}
              </text>
            </g>
          )
        })()}

        {/* Circuit area */}
        {circuit && <CircuitBackground circuit={circuit} theme={theme} />}

        {/* Visualization overlay — or animated playback when playing */}
        {isPlaying ? renderPlayback() : renderViz()}

        {/* Compare legend — both drivers, lap times, delta */}
        {isComparing && compareDriver && driver && telemetry && compareTelemetry && (() => {
          const lx = CIRCUIT_AREA.x + 8
          const ly = CIRCUIT_AREA.y + 12
          const delta = parseLapSeconds(compareTelemetry.lapTime) - parseLapSeconds(telemetry.lapTime)
          const faster = delta === 0 ? null : delta < 0 ? compareDriver.shortName : driver.shortName
          return (
            <g fontFamily="monospace">
              <rect x={lx - 8} y={ly - 12} width="168" height="56" rx="6" fill={theme.bg} opacity="0.55" />
              <circle cx={lx + 4} cy={ly + 2} r="4" fill={driverColor} />
              <text x={lx + 14} y={ly + 5} fill={theme.textColor} fontSize="10">{driver.shortName}</text>
              <text x={lx + 150} y={ly + 5} textAnchor="end" fill={driverColor} fontSize="10" fontWeight="600">{telemetry.lapTime}</text>
              <circle cx={lx + 4} cy={ly + 20} r="4" fill={compareColor} />
              <text x={lx + 14} y={ly + 23} fill={theme.textColor} fontSize="10">{compareDriver.shortName}</text>
              <text x={lx + 150} y={ly + 23} textAnchor="end" fill={compareColor} fontSize="10" fontWeight="600">{compareTelemetry.lapTime}</text>
              {faster && (
                <text x={lx + 150} y={ly + 38} textAnchor="end" fill={theme.fastColor} fontSize="8">
                  {faster} faster by {Math.abs(delta).toFixed(3)}s
                </text>
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
              <text x={L} y={y0 + 8} fill={theme.textDim} fontSize="8" fontFamily="monospace" letterSpacing="3">LAP TIME</text>
              {driver && (
                <text x={R} y={y0 + 8} textAnchor="end" fill={theme.textDim} fontSize="8" fontFamily="monospace" letterSpacing="2">
                  {driver.team.toUpperCase()}
                </text>
              )}
              <text x={L} y={y0 + 34} fill={theme.primaryLine} fontSize="34" fontFamily="monospace" fontWeight="700" letterSpacing="2">
                {telemetry?.lapTime ?? '—:——.———'}
              </text>
              {driver && (
                <text x={R} y={y0 + 34} textAnchor="end" fill={theme.textColor} fontSize="20" fontFamily="Georgia, serif" fontStyle="italic">
                  {driver.shortName}
                </text>
              )}

              {/* Divider 2 */}
              <line x1={L} y1={y0 + 46} x2={R} y2={y0 + 46} stroke={theme.borderColor} strokeWidth="1" opacity="0.4" />

              {/* — Row 2: Sector times — */}
              {telemetry && (() => {
                const colW = W / 3
                const sectors = [
                  { label: 'SECTOR 1', val: telemetry.sectors.s1Time.toFixed(3) + 's', color: theme.s1Color },
                  { label: 'SECTOR 2', val: telemetry.sectors.s2Time.toFixed(3) + 's', color: theme.s2Color },
                  { label: 'SECTOR 3', val: telemetry.sectors.s3Time.toFixed(3) + 's', color: theme.s3Color },
                ]
                return sectors.map((s, i) => (
                  <g key={i}>
                    <rect x={L + i * colW} y={y0 + 50} width={colW - 4} height="38" rx="3" fill={s.color} opacity="0.06" />
                    <text x={L + i * colW + 8} y={y0 + 63} fill={theme.textDim} fontSize="7" fontFamily="monospace" letterSpacing="2">{s.label}</text>
                    <text x={L + i * colW + 8} y={y0 + 81} fill={s.color} fontSize="16" fontFamily="monospace" fontWeight="600">{s.val}</text>
                  </g>
                ))
              })()}

              {/* Divider 3 */}
              <line x1={L} y1={y0 + 96} x2={R} y2={y0 + 96} stroke={theme.borderColor} strokeWidth="1" opacity="0.4" />

              {/* — Row 3: Speed stats grid — */}
              {telemetry && (() => {
                const stats = [
                  { label: 'TOP SPEED',  val: `${telemetry.topSpeed} km/h` },
                  { label: 'AVG SPEED',  val: `${telemetry.averageSpeed} km/h` },
                  { label: 'SAMPLES',    val: `${telemetry.points.length} pts` },
                  { label: 'BENCHMARK', val: telemetry.benchmarkLapTime },
                ]
                const colW = W / 4
                return stats.map((s, i) => (
                  <g key={i}>
                    <text x={L + i * colW + colW / 2} y={y0 + 110} textAnchor="middle" fill={theme.textDim} fontSize="7" fontFamily="monospace" letterSpacing="1">{s.label}</text>
                    <text x={L + i * colW + colW / 2} y={y0 + 124} textAnchor="middle" fill={theme.textColor} fontSize="11" fontFamily="monospace">{s.val}</text>
                  </g>
                ))
              })()}

              {/* Divider 4 */}
              <line x1={L} y1={y0 + 136} x2={R} y2={y0 + 136} stroke={theme.borderColor} strokeWidth="1" opacity="0.4" />

              {/* — Row 4: Circuit name + description — */}
              <text x={L} y={y0 + 152} fill={theme.primaryLine} fontSize="11" fontFamily="monospace" letterSpacing="2">
                {race ? race.circuitName.toUpperCase() : 'SELECT A RACE'}
              </text>
              <text x={R} y={y0 + 152} textAnchor="end" fill={theme.textDim} fontSize="11" fontFamily="monospace" letterSpacing="1">
                {race?.year ?? ''}
              </text>
              {race && (
                <text x={L} y={y0 + 167} fill={theme.textDim} fontSize="8.5" fontFamily="Georgia, serif" fontStyle="italic">
                  {race.location}
                </text>
              )}

              {/* — Row 5: Driver bio snippet — */}
              {driver && (
                <>
                  <line x1={L} y1={y0 + 178} x2={R} y2={y0 + 178} stroke={theme.borderColor} strokeWidth="1" opacity="0.3" />
                  {wrapText(driver.bio, 72).slice(0, 3).map((line, i) => (
                    <text key={i} x={L} y={y0 + 193 + i * 13} fill={theme.textDim} fontSize="8.5"
                      fontFamily="Georgia, serif" fontStyle="italic" opacity="0.7">{line}</text>
                  ))}
                </>
              )}

              {/* Bottom branding */}
              <line x1={L} y1={POSTER_H - 28} x2={R} y2={POSTER_H - 28} stroke={theme.borderColor} strokeWidth="1" opacity="0.35" />
              <text x={L} y={POSTER_H - 12} fill={theme.textDim} fontSize="8" fontFamily="monospace" letterSpacing="3" opacity="0.5">WHERE SPEED BECOMES ART</text>
              <text x={R} y={POSTER_H - 12} textAnchor="end" fill={theme.primaryLine} fontSize="8" fontFamily="monospace" letterSpacing="2" opacity="0.7">F1RACESIGNATURE.SITE</text>
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
