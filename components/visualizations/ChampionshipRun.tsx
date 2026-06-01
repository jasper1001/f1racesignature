'use client'

import type { Telemetry, ThemeConfig } from '@/lib/types'

interface ChampionshipRunProps {
  telemetry: Telemetry
  theme: ThemeConfig
  width: number
  height: number
  driverColor: string
}

export function ChampionshipRun({
  telemetry,
  theme,
  width,
  height,
  driverColor,
}: ChampionshipRunProps) {
  const data = telemetry.championshipPoints ?? []
  if (data.length < 2) return null

  const pad = { top: 24, right: 24, bottom: 24, left: 32 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const maxPts = Math.max(...data)
  const races = data.length

  const ptToXY = (i: number, pts: number) => ({
    x: pad.left + (i / (races - 1)) * chartW,
    y: pad.top + chartH - (pts / maxPts) * chartH,
  })

  const coords = data.map((pts, i) => ptToXY(i, pts))

  // Smooth path
  let d = `M ${coords[0].x} ${coords[0].y}`
  for (let i = 1; i < coords.length - 1; i++) {
    const cp1x = (coords[i - 1].x + coords[i].x) / 2
    const cp1y = (coords[i - 1].y + coords[i].y) / 2
    const cp2x = (coords[i].x + coords[i + 1].x) / 2
    const cp2y = (coords[i].y + coords[i + 1].y) / 2
    d += ` C ${cp1x} ${cp1y}, ${coords[i].x} ${coords[i].y}, ${cp2x} ${cp2y}`
  }
  d += ` L ${coords[coords.length - 1].x} ${coords[coords.length - 1].y}`

  const fillPath = `${d} L ${coords[coords.length - 1].x} ${pad.top + chartH} L ${coords[0].x} ${pad.top + chartH} Z`

  return (
    <g>
      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.top + chartH - t * chartH
        return (
          <g key={t}>
            <line
              x1={pad.left}
              y1={y}
              x2={pad.left + chartW}
              y2={y}
              stroke={theme.borderColor}
              strokeWidth="1"
              opacity="0.4"
            />
            <text x={pad.left - 4} y={y + 4} textAnchor="end" fill={theme.textDim} fontSize="8">
              {Math.round(t * maxPts)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={fillPath} fill={driverColor} opacity="0.08" />

      {/* Line */}
      <path d={d} fill="none" stroke={driverColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

      {/* Data dots */}
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="2.5" fill={driverColor} opacity="0.7" />
      ))}

      {/* Final point highlight */}
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r="5"
        fill={driverColor}
        opacity="0.9"
      />
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r="9"
        fill="none"
        stroke={driverColor}
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Label */}
      <text
        x={coords[coords.length - 1].x + 6}
        y={coords[coords.length - 1].y + 4}
        fill={driverColor}
        fontSize="10"
        fontFamily="monospace"
      >
        {data[data.length - 1]} pts
      </text>
    </g>
  )
}
