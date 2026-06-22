'use client'

import type { TelemetryPoint, ThemeConfig } from '@/lib/types'

interface RacingLineProps {
  points: TelemetryPoint[]
  theme: ThemeConfig
  width: number
  height: number
  driverColor: string
}

export function RacingLine({ points, theme, width, height, driverColor }: RacingLineProps) {
  if (points.length < 2) return null

  const xs = points.map((p) => p.x * width)
  const ys = points.map((p) => p.y * height)

  // Smooth bezier path
  let d = `M ${xs[0]} ${ys[0]}`
  for (let i = 1; i < points.length - 1; i++) {
    const cpx1 = (xs[i - 1] + xs[i]) / 2
    const cpy1 = (ys[i - 1] + ys[i]) / 2
    const cpx2 = (xs[i] + xs[i + 1]) / 2
    const cpy2 = (ys[i] + ys[i + 1]) / 2
    d += ` C ${cpx1} ${cpy1}, ${xs[i]} ${ys[i]}, ${cpx2} ${cpy2}`
  }
  d += ` L ${xs[xs.length - 1]} ${ys[ys.length - 1]}`

  return (
    <g>
      {/* Main racing line */}
      <path d={d} fill="none" stroke={driverColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="1" />
      {/* Start marker */}
      <circle cx={xs[0]} cy={ys[0]} r="5" fill={driverColor} opacity="1" />
      <circle cx={xs[0]} cy={ys[0]} r="10" fill="none" stroke={driverColor} strokeWidth="1.5" opacity="0.4" />
    </g>
  )
}
