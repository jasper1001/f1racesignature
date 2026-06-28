'use client'

import type { ThemeConfig } from '@/lib/types'

interface RacingLineProps {
  // Only x/y are read, so both telemetry points and a computed racing line fit.
  points: { x: number; y: number }[]
  theme: ThemeConfig
  width: number
  height: number
  driverColor: string
  strokeWidth?: number
}

export function RacingLine({ points, theme, width, height, driverColor, strokeWidth = 3.5 }: RacingLineProps) {
  if (points.length < 2) return null

  const xs = points.map((p) => p.x * width)
  const ys = points.map((p) => p.y * height)
  const n = xs.length

  // Catmull-Rom spline → cubic béziers: a C1-continuous curve that passes through
  // every telemetry point, so corners read as smooth arcs instead of faceted
  // straight-line joins. Endpoints are clamped (no wrap).
  let d = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`
  for (let i = 0; i < n - 1; i++) {
    const x0 = xs[i === 0 ? 0 : i - 1], y0 = ys[i === 0 ? 0 : i - 1]
    const x1 = xs[i], y1 = ys[i]
    const x2 = xs[i + 1], y2 = ys[i + 1]
    const x3 = xs[i + 2 < n ? i + 2 : n - 1], y3 = ys[i + 2 < n ? i + 2 : n - 1]
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }

  return (
    <g>
      {/* Main racing line */}
      <path d={d} fill="none" stroke={driverColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity="1" />
      {/* Start marker */}
      <circle cx={xs[0]} cy={ys[0]} r="5" fill={driverColor} opacity="1" />
      <circle cx={xs[0]} cy={ys[0]} r="10" fill="none" stroke={driverColor} strokeWidth="1.5" opacity="0.4" />
    </g>
  )
}
