'use client'

import type { TelemetryPoint, ThemeConfig } from '@/lib/types'

interface SectorSplitProps {
  points: TelemetryPoint[]
  theme: ThemeConfig
  width: number
  height: number
}

const SECTOR_COLORS = {
  1: '#00e676', // green
  2: '#ffea00', // yellow
  3: '#c800ff', // purple
}

export function SectorSplit({ points, theme, width, height }: SectorSplitProps) {
  if (points.length < 2) return null

  // Group consecutive points by sector
  const sectors: { sector: 1 | 2 | 3; pts: TelemetryPoint[] }[] = []
  let current = points[0].sector
  let group: TelemetryPoint[] = [points[0]]

  for (let i = 1; i < points.length; i++) {
    if (points[i].sector === current) {
      group.push(points[i])
    } else {
      sectors.push({ sector: current, pts: [...group] })
      current = points[i].sector
      group = [group[group.length - 1], points[i]] // overlap to avoid gaps
    }
  }
  sectors.push({ sector: current, pts: group })

  const buildPath = (pts: TelemetryPoint[]) => {
    if (pts.length < 2) return ''
    const xs = pts.map((p) => p.x * width)
    const ys = pts.map((p) => p.y * height)
    let d = `M ${xs[0]} ${ys[0]}`
    for (let i = 1; i < pts.length - 1; i++) {
      const cpx1 = (xs[i - 1] + xs[i]) / 2
      const cpy1 = (ys[i - 1] + ys[i]) / 2
      const cpx2 = (xs[i] + xs[i + 1]) / 2
      const cpy2 = (ys[i] + ys[i + 1]) / 2
      d += ` C ${cpx1} ${cpy1}, ${xs[i]} ${ys[i]}, ${cpx2} ${cpy2}`
    }
    d += ` L ${xs[xs.length - 1]} ${ys[ys.length - 1]}`
    return d
  }

  return (
    <g>
      {sectors.map((s, i) => {
        const d = buildPath(s.pts)
        const color = SECTOR_COLORS[s.sector]
        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.1"
            />
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>
        )
      })}
    </g>
  )
}
