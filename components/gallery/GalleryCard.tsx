'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { GalleryItem, Circuit, Telemetry, ThemeConfig } from '@/lib/types'
import { THEMES } from '@/lib/themes'
import { Analytics } from '@/lib/analytics'
import { isRaceFree } from '@/lib/freemium'

interface GalleryCardProps {
  item: GalleryItem
  index: number
  circuit: Circuit | null
  telemetry: Telemetry | null
}

const CARD_W = 200
const CARD_H = 267
const C_AREA = { x: 18, y: 52, w: 184, h: 148 }

function MiniCircuit({
  circuit,
  telemetry,
  driverColor,
  theme,
}: {
  circuit: Circuit
  telemetry: Telemetry | null
  driverColor: string
  theme: ThemeConfig
}) {
  const scaleX = C_AREA.w / 500
  const scaleY = C_AREA.h / 420

  // Build racing line path from telemetry
  let racingPath = ''
  if (telemetry && telemetry.points.length > 1) {
    const pts = telemetry.points.map((p) => ({
      x: (p.x * C_AREA.w + C_AREA.x),
      y: (p.y * C_AREA.h + C_AREA.y),
    }))
    racingPath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ')
  }

  return (
    <>
      {/* Asphalt track */}
      <g transform={`translate(${C_AREA.x}, ${C_AREA.y}) scale(${scaleX}, ${scaleY})`}>
        <path d={circuit.path} fill="none" stroke="#2a2a2a" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d={circuit.path} fill="none" stroke="#3a3a3a" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d={circuit.path} fill="none" stroke="#4a4a4a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Racing line from real telemetry */}
      {racingPath && (
        <>
          <path d={racingPath} fill="none" stroke={driverColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
          <path d={racingPath} fill="none" stroke={driverColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        </>
      )}
    </>
  )
}

export function GalleryCard({ item, index, circuit, telemetry }: GalleryCardProps) {
  const [hovered, setHovered] = useState(false)
  const theme = THEMES.find((t) => t.id === item.theme) ?? THEMES[0]
  const isLocked = item.isPremium && !isRaceFree(item.raceId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
    >
      <div
        className="group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => Analytics.galleryItemClicked(item.id)}
      >
        {/* Poster */}
        <div
          className="relative rounded-xl overflow-hidden transition-all duration-300 w-full"
          style={{
            boxShadow: hovered
              ? `0 24px 64px ${theme.accentGlow}, 0 0 0 1px ${theme.primaryLine}44`
              : '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${CARD_W} ${CARD_H}`}
            style={{ display: 'block', aspectRatio: `${CARD_W}/${CARD_H}` }}
          >
            {/* Background */}
            <rect width={CARD_W} height={CARD_H} fill={theme.bg} />

            {/* Subtle radial glow */}
            <radialGradient id={`g-${item.id}`} cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor={item.driverColor} stopOpacity="0.07" />
              <stop offset="100%" stopColor={theme.bg} stopOpacity="0" />
            </radialGradient>
            <rect width={CARD_W} height={CARD_H} fill={`url(#g-${item.id})`} />

            {/* Top accent bar */}
            <rect width={CARD_W} height="2" fill={theme.primaryLine} opacity="0.8" />

            {/* Header */}
            <text x={CARD_W / 2} y="18" textAnchor="middle" fill={theme.textDim}
              fontSize="7" fontFamily="monospace" letterSpacing="3" opacity="0.7">
              F1RACESIGNATURE
            </text>
            <text x={CARD_W / 2} y="36" textAnchor="middle" fill={theme.textColor}
              fontSize="13" fontFamily="Georgia, serif" fontStyle="italic">
              {item.subtitle.split('—')[0].trim()}
            </text>

            {/* Circuit area */}
            {circuit ? (
              <MiniCircuit
                circuit={circuit}
                telemetry={telemetry}
                driverColor={item.driverColor}
                theme={theme}
              />
            ) : (
              /* Skeleton while loading */
              <rect x={C_AREA.x} y={C_AREA.y} width={C_AREA.w} height={C_AREA.h}
                fill="#111111" rx="4" opacity="0.5" />
            )}

            {/* Divider */}
            <line x1="18" y1="210" x2={CARD_W - 18} y2="210"
              stroke={theme.borderColor} strokeWidth="1" opacity="0.6" />

            {/* Lap time */}
            {telemetry && (
              <>
                <text x="18" y="224" fill={theme.textDim} fontSize="7" fontFamily="monospace" letterSpacing="2">LAP TIME</text>
                <text x="18" y="238" fill={theme.primaryLine} fontSize="14" fontFamily="monospace" fontWeight="600" letterSpacing="1">
                  {telemetry.lapTime}
                </text>
                <text x={CARD_W - 18} y="238" textAnchor="end" fill={theme.textDim} fontSize="8" fontFamily="monospace">
                  {telemetry.topSpeed} km/h
                </text>
              </>
            )}

            {/* Title */}
            <text x={CARD_W / 2} y="258" textAnchor="middle" fill={theme.textColor}
              fontSize="14" fontFamily="Georgia, serif" fontStyle="italic">
              {item.title}
            </text>
            <text x={CARD_W / 2} y="271" textAnchor="middle" fill={theme.textDim}
              fontSize="7" fontFamily="monospace" letterSpacing="1.5">
              {item.subtitle.toUpperCase()}
            </text>

            {/* Badge */}
            {item.badge && (
              <>
                <rect
                  x={(CARD_W - item.badge.length * 5.8 - 14) / 2}
                  y="278" width={item.badge.length * 5.8 + 14} height="11" rx="2"
                  fill={theme.primaryLine} opacity="0.18"
                />
                <text x={CARD_W / 2} y="286.5" textAnchor="middle" fill={theme.primaryLine}
                  fontSize="6.5" fontFamily="monospace" letterSpacing="2">
                  {item.badge.toUpperCase()}
                </text>
              </>
            )}

            {/* Bottom accent */}
            <rect x="0" y={CARD_H - 2} width={CARD_W} height="2" fill={theme.primaryLine} opacity="0.35" />

            {/* Lock overlay */}
            {isLocked && !hovered && (
              <>
                <rect width={CARD_W} height={CARD_H} fill="black" opacity="0.45" />
                <g transform={`translate(${CARD_W / 2 - 14}, ${CARD_H / 2 - 20})`}>
                  <rect width="28" height="28" rx="14" fill={theme.bg} opacity="0.9" />
                  <svg x="6" y="5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="7" width="12" height="9" rx="2" fill={theme.primaryLine} opacity="0.8" />
                    <path d="M4.5 7V5a3.5 3.5 0 017 0v2" stroke={theme.primaryLine} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </g>
                <text x={CARD_W / 2} y={CARD_H / 2 + 20} textAnchor="middle"
                  fill={theme.textDim} fontSize="8" fontFamily="monospace" letterSpacing="2">
                  PREMIUM
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Below-card label */}
        <div className="mt-3 px-1">
          <p className="text-white text-sm font-medium truncate">{item.title}</p>
          <p className="text-[#555555] text-xs mt-0.5">{item.subtitle}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: theme.primaryLine, backgroundColor: theme.primaryLine + '18' }}
            >
              {theme.name.toUpperCase()}
            </span>
            {isLocked && (
              <span className="text-[10px] text-[#444444] font-mono">PREMIUM</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
