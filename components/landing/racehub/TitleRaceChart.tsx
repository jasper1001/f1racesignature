'use client'

export interface TitleSeries {
  code: string
  color: string
  total: number
  /** Cumulative points at each completed round, index 0 = round 1. */
  cum: number[]
}

// A compact multi-line chart of championship points progression by round —
// the "Title Race" panel. Pure SVG, animated stroke-draw on mount.
export function TitleRaceChart({ series, rounds }: { series: TitleSeries[]; rounds: number }) {
  const W = 900
  const H = 340
  const padL = 12
  const padR = 12
  const padT = 20
  const padB = 34

  const maxPts = Math.max(1, ...series.map((s) => s.total))
  const lastRoundIdx = Math.max(1, rounds - 1)

  const x = (roundIdx: number) => padL + (roundIdx / lastRoundIdx) * (W - padL - padR)
  const y = (pts: number) => padT + (1 - pts / maxPts) * (H - padT - padB)

  // Gridlines at the rounds axis (R01..Rnn), thinned if many rounds.
  const step = rounds > 12 ? 3 : rounds > 8 ? 2 : 1
  const ticks: number[] = []
  for (let i = 0; i < rounds; i += step) ticks.push(i)
  if (ticks[ticks.length - 1] !== rounds - 1) ticks.push(rounds - 1)

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Championship points by round">
          {/* Horizontal reference gridlines */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={padL}
              x2={W - padR}
              y1={y(maxPts * f)}
              y2={y(maxPts * f)}
              stroke="#ffffff"
              strokeOpacity={0.05}
              strokeWidth={1}
            />
          ))}

          {/* Round labels */}
          {ticks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 12}
              textAnchor="middle"
              className="font-mono"
              fontSize={11}
              fill="#ffffff"
              fillOpacity={0.35}
            >
              R{String(i + 1).padStart(2, '0')}
            </text>
          ))}

          {/* Lines */}
          {series.map((s, si) => {
            const pts = s.cum.map((v, i) => `${x(i)},${y(v)}`).join(' ')
            const last = s.cum.length - 1
            return (
              <g key={s.code}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pathLength={1}
                  className="title-line"
                  style={{ animationDelay: `${si * 0.12}s` }}
                />
                <circle cx={x(last)} cy={y(s.cum[last])} r={4} fill={s.color} />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {series.map((s) => (
          <span key={s.code} className="inline-flex items-center gap-2">
            <span className="w-4 h-[3px] rounded-full" style={{ background: s.color }} />
            <span className="text-white text-xs font-mono font-semibold tracking-wide">{s.code}</span>
            <span className="text-white/50 text-xs font-mono">{s.total}</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes drawLine { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        .title-line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: drawLine 1.4s ease forwards; }
        @media (prefers-reduced-motion: reduce) { .title-line { animation: none; stroke-dashoffset: 0; } }
      `}</style>
    </div>
  )
}
