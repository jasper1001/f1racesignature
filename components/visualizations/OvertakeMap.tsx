'use client'

import type { TelemetryPoint, ThemeConfig } from '@/lib/types'

interface OvertakeMapProps {
  points: TelemetryPoint[]
  theme: ThemeConfig
  width: number
  height: number
  driverColor: string
}

// Approximate overtake positions along the track (normalized distance 0-1)
const OVERTAKE_DISTANCES = [0.08, 0.22, 0.48, 0.65, 0.82]

export function OvertakeMap({ points, theme, width, height, driverColor }: OvertakeMapProps) {
  if (points.length < 2) return null

  const xs = points.map((p) => p.x * width)
  const ys = points.map((p) => p.y * height)

  let d = `M ${xs[0]} ${ys[0]}`
  for (let i = 1; i < points.length - 1; i++) {
    const cpx1 = (xs[i - 1] + xs[i]) / 2
    const cpy1 = (ys[i - 1] + ys[i]) / 2
    const cpx2 = (xs[i] + xs[i + 1]) / 2
    const cpy2 = (ys[i] + ys[i + 1]) / 2
    d += ` C ${cpx1} ${cpy1}, ${xs[i]} ${ys[i]}, ${cpx2} ${cpy2}`
  }

  // Find points near overtake distances
  const overtakePts = OVERTAKE_DISTANCES.map((targetDist) => {
    const closest = points.reduce((best, pt) => {
      return Math.abs(pt.distance - targetDist) < Math.abs(best.distance - targetDist) ? pt : best
    }, points[0])
    return closest
  })

  return (
    <g>
      {/* Base track */}
      <path d={d} fill="none" stroke={driverColor} strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Overtake markers */}
      {overtakePts.map((pt, i) => {
        const x = pt.x * width
        const y = pt.y * height
        return (
          <g key={i}>
            {/* Outer ring */}
            <circle cx={x} cy={y} r="12" fill="none" stroke={driverColor} strokeWidth="1" opacity="0.2" />
            <circle cx={x} cy={y} r="8" fill="none" stroke={driverColor} strokeWidth="1.5" opacity="0.4" />
            {/* Inner dot */}
            <circle cx={x} cy={y} r="4" fill={driverColor} opacity="0.9" />
            <circle cx={x} cy={y} r="2" fill="white" opacity="0.7" />
          </g>
        )
      })}
    </g>
  )
}
