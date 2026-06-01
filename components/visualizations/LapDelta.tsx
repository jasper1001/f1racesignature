'use client'

import type { Telemetry, ThemeConfig } from '@/lib/types'
import { parselapTime } from '@/lib/data'

interface LapDeltaProps {
  telemetry: Telemetry
  theme: ThemeConfig
  width: number
  height: number
  driverColor: string
}

export function LapDelta({ telemetry, theme, width, height, driverColor }: LapDeltaProps) {
  const { points, lapTime, benchmarkLapTime } = telemetry

  const lapSecs = parselapTime(lapTime)
  const benchSecs = parselapTime(benchmarkLapTime)
  const delta = lapSecs - benchSecs // negative = faster

  const chartPad = { top: 20, right: 20, bottom: 20, left: 30 }
  const chartW = width - chartPad.left - chartPad.right
  const chartH = height - chartPad.top - chartPad.bottom

  // Simulate delta curve over lap distance
  const driverPts = points.map((pt, i) => {
    const x = chartPad.left + pt.distance * chartW
    const sinWave = Math.sin(pt.distance * Math.PI * 3) * 0.3
    const cumDelta = delta * pt.distance + delta * sinWave * 0.4
    const y = chartPad.top + chartH / 2 - (cumDelta / Math.abs(delta) || 0) * (chartH * 0.38)
    return { x, y }
  })

  const benchPts = points.map((pt) => {
    const x = chartPad.left + pt.distance * chartW
    const y = chartPad.top + chartH / 2
    return { x, y }
  })

  const toPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return ''
    return pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`
      return `${acc} L ${pt.x} ${pt.y}`
    }, '')
  }

  const driverPath = toPath(driverPts)
  const benchPath = toPath(benchPts)

  const midY = chartPad.top + chartH / 2

  return (
    <g>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={chartPad.left + t * chartW}
          y1={chartPad.top}
          x2={chartPad.left + t * chartW}
          y2={chartPad.top + chartH}
          stroke={theme.borderColor}
          strokeWidth="1"
          opacity="0.5"
        />
      ))}

      {/* Zero line */}
      <line
        x1={chartPad.left}
        y1={midY}
        x2={chartPad.left + chartW}
        y2={midY}
        stroke={theme.textDim}
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.4"
      />

      {/* Benchmark line */}
      <path
        d={benchPath}
        fill="none"
        stroke={theme.textDim}
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.5"
      />

      {/* Driver delta line - filled area */}
      {driverPts.length > 1 && (
        <path
          d={`${driverPath} L ${driverPts[driverPts.length - 1].x} ${midY} L ${driverPts[0].x} ${midY} Z`}
          fill={driverColor}
          opacity="0.08"
        />
      )}
      <path
        d={driverPath}
        fill="none"
        stroke={driverColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Delta label */}
      <text
        x={chartPad.left + chartW - 4}
        y={chartPad.top + 14}
        textAnchor="end"
        fill={delta < 0 ? theme.fastColor : theme.slowColor}
        fontSize="10"
        fontFamily="monospace"
      >
        {delta < 0 ? '' : '+'}{delta.toFixed(3)}s
      </text>
    </g>
  )
}
