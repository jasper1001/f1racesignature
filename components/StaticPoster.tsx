import type { Driver, Race, Telemetry, Circuit } from '@/lib/types'
import { themeById } from '@/lib/themes'
import { teamAtYear } from '@/lib/driverTeams'

const W = 480
const H = 600
const AREA = { x: 36, y: 70, w: 408, h: 360 }

interface Props {
  driver: Driver
  race: Race
  telemetry: Telemetry | null
  circuit: Circuit | null
  themeId?: string
}

/**
 * Server-rendered static poster (no client state) used on race detail pages.
 * Draws the real circuit outline + the driver's GPS racing line.
 */
export function StaticPoster({ driver, race, telemetry, circuit, themeId = 'carbon_fiber' }: Props) {
  const theme = themeById(themeId)
  // Use the livery colour for the team the driver actually raced for that year,
  // not their current team (e.g. Hamilton at Silverstone 2020 = Mercedes, not Ferrari).
  const color = teamAtYear(driver.id, race.year)?.color ?? driver.color ?? theme.primaryLine

  const scaleX = AREA.w / 500
  const scaleY = AREA.h / 420

  let racingPath = ''
  if (telemetry && telemetry.points.length > 1) {
    racingPath = telemetry.points
      .map((p, i) => {
        const x = (p.x * AREA.w + AREA.x).toFixed(1)
        const y = (p.y * AREA.h + AREA.y).toFixed(1)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', borderRadius: 12, background: theme.bg, aspectRatio: `${W}/${H}` }}
      role="img"
      aria-label={`${driver.name} — ${race.name} racing line poster`}
    >
      <rect width={W} height={H} fill={theme.bg} />
      <rect width={W} height="2" fill={theme.primaryLine} opacity="0.7" />

      <text x={W / 2} y="30" textAnchor="middle" fill={theme.textDim} fontSize="9" fontFamily="monospace" letterSpacing="4">
        F1RACESIGNATURE
      </text>
      <text x={W / 2} y="54" textAnchor="middle" fill={theme.textColor} fontSize="22" fontFamily="Georgia, serif" fontStyle="italic">
        {driver.name}
      </text>

      {/* Circuit */}
      {circuit && (
        <g transform={`translate(${AREA.x}, ${AREA.y}) scale(${scaleX}, ${scaleY})`}>
          <path d={circuit.path} fill="none" stroke="#3a3a3a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <path d={circuit.path} fill="none" stroke="#555" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </g>
      )}

      {/* Racing line */}
      {racingPath && (
        <>
          <path d={racingPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
          <path d={racingPath} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {/* Stats */}
      <line x1={AREA.x} y1={H - 130} x2={W - AREA.x} y2={H - 130} stroke={theme.borderColor} strokeWidth="1" opacity="0.5" />
      <text x={AREA.x} y={H - 108} fill={theme.textDim} fontSize="8" fontFamily="monospace" letterSpacing="3">LAP TIME</text>
      <text x={AREA.x} y={H - 84} fill={theme.primaryLine} fontSize="30" fontFamily="monospace" fontWeight="700">
        {telemetry?.lapTime ?? race.lapTime}
      </text>

      {telemetry && (
        <>
          <text x={W - AREA.x} y={H - 108} textAnchor="end" fill={theme.textDim} fontSize="8" fontFamily="monospace" letterSpacing="2">V-MAX</text>
          <text x={W - AREA.x} y={H - 86} textAnchor="end" fill={theme.textColor} fontSize="16" fontFamily="monospace">{telemetry.topSpeed} km/h</text>
        </>
      )}

      <text x={AREA.x} y={H - 56} fill={theme.primaryLine} fontSize="11" fontFamily="monospace" letterSpacing="2">
        {race.circuitName.toUpperCase()}
      </text>
      <text x={AREA.x} y={H - 40} fill={theme.textDim} fontSize="9" fontFamily="Georgia, serif" fontStyle="italic">
        {race.location} · {race.year}
      </text>

      <line x1="0" y1={H - 2} x2={W} y2={H - 2} fill="none" stroke={theme.primaryLine} strokeWidth="2" opacity="0.4" />
    </svg>
  )
}
