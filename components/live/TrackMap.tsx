'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface TrackPoint {
  x: number
  y: number
}

interface CarPos {
  driverNumber: number
  x: number
  y: number
  acronym: string
  teamColor: string
}

// ── Coordinate transform ───────────────────────────────────────────────────────

const SVG_W = 1000
const SVG_H = 580
const PAD = 48

function makeTransform(bounds: Bounds) {
  const dataW = bounds.maxX - bounds.minX
  const dataH = bounds.maxY - bounds.minY
  const scaleX = (SVG_W - 2 * PAD) / dataW
  const scaleY = (SVG_H - 2 * PAD) / dataH
  const scale = Math.min(scaleX, scaleY)

  const usedW = dataW * scale
  const usedH = dataH * scale
  const originX = PAD + (SVG_W - 2 * PAD - usedW) / 2
  const originY = PAD + (SVG_H - 2 * PAD - usedH) / 2

  return {
    // Flip Y so north is up (SVG Y grows downward)
    x: (v: number) => originX + (v - bounds.minX) * scale,
    y: (v: number) => originY + (bounds.maxY - v) * scale,
  }
}

// ── Car marker ─────────────────────────────────────────────────────────────────

function CarMarker({ car, tx, ty }: { car: CarPos; tx: number; ty: number }) {
  const color = `#${car.teamColor}`
  return (
    <motion.g
      key={car.driverNumber}
      initial={{ x: tx, y: ty, opacity: 0 }}
      animate={{ x: tx, y: ty, opacity: 1 }}
      transition={{ x: { duration: 2, ease: 'linear' }, y: { duration: 2, ease: 'linear' }, opacity: { duration: 0.4 } }}
    >
      {/* Glow halo */}
      <circle r={11} fill={color} opacity={0.18} />
      {/* Body */}
      <circle r={7} fill={color} />
      {/* Label */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isLightColor(car.teamColor) ? '#000' : '#fff'}
        fontSize={5.5}
        fontWeight="bold"
        fontFamily="monospace"
        letterSpacing="0"
      >
        {car.acronym.slice(0, 3)}
      </text>
    </motion.g>
  )
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TrackMap() {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([])
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [cars, setCars] = useState<CarPos[]>([])
  const [status, setStatus] = useState<'loading' | 'empty' | 'live' | 'error'>('loading')
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const boundsRef = useRef<Bounds | null>(null)

  // Fetch track outline once
  useEffect(() => {
    fetch('/api/live-track?type=outline')
      .then(r => r.json())
      .then((data: { points: TrackPoint[]; bounds: Bounds | null }) => {
        if (data.bounds) {
          setTrackPoints(data.points)
          setBounds(data.bounds)
          boundsRef.current = data.bounds
        }
      })
      .catch(() => {})
  }, [])

  // Poll car positions
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/live-track?type=positions')
      if (!res.ok) throw new Error()
      const data: { cars: CarPos[]; updatedAt: string } = await res.json()

      if (!data.cars.length) {
        setStatus(prev => prev === 'loading' ? 'empty' : prev)
        return
      }

      setCars(data.cars)
      setLastUpdate(data.updatedAt)
      setStatus('live')

      // Expand bounds if needed (cars outside current bounds)
      const currentBounds = boundsRef.current
      if (currentBounds) {
        const allX = data.cars.map(c => c.x)
        const allY = data.cars.map(c => c.y)
        const newBounds: Bounds = {
          minX: Math.min(currentBounds.minX, ...allX),
          maxX: Math.max(currentBounds.maxX, ...allX),
          minY: Math.min(currentBounds.minY, ...allY),
          maxY: Math.max(currentBounds.maxY, ...allY),
        }
        // Only update if bounds actually grew
        if (
          newBounds.minX < currentBounds.minX ||
          newBounds.maxX > currentBounds.maxX ||
          newBounds.minY < currentBounds.minY ||
          newBounds.maxY > currentBounds.maxY
        ) {
          setBounds(newBounds)
          boundsRef.current = newBounds
        }
      } else {
        // Bootstrap bounds from car positions if outline fetch had no data
        const allX = data.cars.map(c => c.x)
        const allY = data.cars.map(c => c.y)
        const bootstrapped: Bounds = {
          minX: Math.min(...allX) - 100,
          maxX: Math.max(...allX) + 100,
          minY: Math.min(...allY) - 100,
          maxY: Math.max(...allY) + 100,
        }
        setBounds(bootstrapped)
        boundsRef.current = bootstrapped
      }
    } catch {
      setStatus(prev => prev === 'loading' ? 'error' : prev)
    }
  }, [])

  useEffect(() => {
    fetchPositions()
    const id = setInterval(fetchPositions, 8000)
    return () => clearInterval(id)
  }, [fetchPositions])

  // ── Render ─────────────────────────────────────────────────────────────────

  const transform = bounds ? makeTransform(bounds) : null

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest">Track Map</span>
          {status === 'live' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#43b02a]/10 border border-[#43b02a]/25 text-[#43b02a] text-[9px] font-mono uppercase tracking-widest">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#43b02a] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#43b02a]" />
              </span>
              Live
            </span>
          )}
        </div>
        {lastUpdate && (
          <span className="text-white/20 text-[9px] font-mono">
            {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* SVG canvas */}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{ background: '#040404', border: '1px solid #141414' }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ display: 'block' }}
        >
          {/* Background grid (subtle) */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

          {/* Track outline: scatter dots from car history */}
          {transform && trackPoints.map((pt, i) => (
            <circle
              key={i}
              cx={transform.x(pt.x)}
              cy={transform.y(pt.y)}
              r={2.5}
              fill="rgba(255,255,255,0.07)"
            />
          ))}

          {/* Car markers */}
          <AnimatePresence>
            {transform && cars.map(car => (
              <CarMarker
                key={car.driverNumber}
                car={car}
                tx={transform.x(car.x)}
                ty={transform.y(car.y)}
              />
            ))}
          </AnimatePresence>
        </svg>

        {/* Loading overlay */}
        <AnimatePresence>
          {(status === 'loading' || (status !== 'live' && cars.length === 0)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(4,4,4,0.85)' }}
            >
              {status === 'loading' && (
                <>
                  <div className="w-6 h-6 border-2 border-[#43b02a] border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/40 text-xs font-mono">Acquiring car positions…</p>
                </>
              )}
              {status === 'error' && (
                <p className="text-white/40 text-xs font-mono">Could not connect to position feed.</p>
              )}
              {status === 'empty' && (
                <p className="text-white/40 text-xs font-mono">No active session — track map will appear when racing starts.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Car legend */}
      {cars.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[...cars]
            .sort((a, b) => a.driverNumber - b.driverNumber)
            .map(car => (
              <div key={car.driverNumber} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: `#${car.teamColor}` }}
                />
                <span className="text-white/50 text-[10px] font-mono">{car.acronym}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
