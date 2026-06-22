'use client'

import { useMemo } from 'react'
import type { TelemetryPoint, ThemeConfig } from '@/lib/types'
import { interpolateColor } from '@/lib/data'

interface SpeedHeatmapProps {
  points: TelemetryPoint[]
  theme: ThemeConfig
  width: number
  height: number
}

export function SpeedHeatmap({ points, theme, width, height }: SpeedHeatmapProps) {
  const segments = useMemo(() => {
    if (points.length < 2) return []
    const speeds = points.map((p) => p.speed)
    const minSpeed = Math.min(...speeds)
    const maxSpeed = Math.max(...speeds)

    return points.slice(0, -1).map((pt, i) => {
      const next = points[i + 1]
      const t = (pt.speed - minSpeed) / (maxSpeed - minSpeed || 1)
      // Three-stop gradient: slow (blue) -> mid (yellow) -> fast (red)
      let color: string
      if (t < 0.5) {
        color = interpolateColor(theme.slowColor, theme.midColor, t * 2)
      } else {
        color = interpolateColor(theme.midColor, theme.fastColor, (t - 0.5) * 2)
      }

      const x1 = pt.x * width
      const y1 = pt.y * height
      const x2 = next.x * width
      const y2 = next.y * height

      return { x1, y1, x2, y2, color, speed: pt.speed, t }
    })
  }, [points, theme, width, height])

  if (segments.length === 0) return null

  return (
    <g>
      {/* Main colored line */}
      {segments.map((seg, i) => (
        <line key={`seg-${i}`} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
          stroke={seg.color} strokeWidth="4" strokeLinecap="round" opacity="1" />
      ))}
    </g>
  )
}
