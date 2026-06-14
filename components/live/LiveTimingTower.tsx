'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TimingEntry {
  position: number
  driverNumber: number
  name: string
  acronym: string
  team: string
  teamColor: string
  countryCode: string
  gap: string
  interval: string
  lastLap: string
  compound: string
  tyreAge: number
  pits: number
}

interface RCMessage {
  time: string
  message: string
  flag: string | null
  category: string
  lap: number | null
}

interface WeatherInfo {
  trackTemp: number
  airTemp: number
  rainfall: number
  windSpeed: number
}

interface LiveData {
  isLive: boolean
  sessionName: string
  meetingName: string
  circuit: string
  country: string
  year: number
  timing: TimingEntry[]
  raceControl: RCMessage[]
  weather: WeatherInfo | null
  lastUpdated: string
}

// ── Tyre compound ──────────────────────────────────────────────────────────────

const COMPOUND: Record<string, { label: string; color: string }> = {
  SOFT:         { label: 'S', color: '#e8002d' },
  MEDIUM:       { label: 'M', color: '#ffd700' },
  HARD:         { label: 'H', color: '#e8e8e8' },
  INTERMEDIATE: { label: 'I', color: '#43b02a' },
  WET:          { label: 'W', color: '#0080ff' },
  UNKNOWN:      { label: '?', color: '#555555' },
}

function TyreCompound({ compound, age }: { compound: string; age: number }) {
  const c = COMPOUND[compound] ?? COMPOUND.UNKNOWN
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: c.color }}
      >
        <span className="text-[9px] font-bold" style={{ color: c.color }}>{c.label}</span>
      </div>
      <span className="text-white/50 text-xs font-mono tabular-nums">
        {age > 0 ? `${age}L` : '—'}
      </span>
    </div>
  )
}

// ── Flag dot ───────────────────────────────────────────────────────────────────

const FLAG_COLOR: Record<string, string> = {
  RED:    '#e8002d',
  YELLOW: '#ffd700',
  GREEN:  '#43b02a',
  BLUE:   '#0080ff',
  BLACK:  '#ffffff',
  WHITE:  '#ffffff',
  CHEQUERED: '#ffffff',
}

function RCFlag({ flag }: { flag: string | null }) {
  if (!flag) return null
  const color = FLAG_COLOR[flag] ?? '#888888'
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0 mt-0.5"
      style={{ background: color }}
    />
  )
}

// ── Pulse dot ─────────────────────────────────────────────────────────────────

function LiveBadge({ isLive }: { isLive: boolean }) {
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8002d]/10 border border-[#e8002d]/30 text-[#e8002d] text-[10px] font-mono uppercase tracking-widest">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8002d] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8002d]" />
        </span>
        LIVE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest">
      REPLAY
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LiveTimingTower() {
  const [data, setData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [liveBlocked, setLiveBlocked] = useState(false)
  const [secondsSince, setSecondsSince] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/live-timing')
      const json = await res.json()
      if (json?.error === 'live_session') {
        setLiveBlocked(true)
        setFetchError(false)
        setLoading(false)
        return
      }
      if (!res.ok || json?.error) throw new Error()
      setData(json as LiveData)
      setLiveBlocked(false)
      setFetchError(false)
      setSecondsSince(0)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh — poll faster when blocked so we catch when OpenF1 lifts the lock
  useEffect(() => {
    const interval = liveBlocked ? 30000 : data?.isLive ? 12000 : 60000
    const id = setInterval(fetchData, interval)
    return () => clearInterval(id)
  }, [liveBlocked, data?.isLive, fetchData])

  // "X seconds ago" counter
  useEffect(() => {
    const id = setInterval(() => setSecondsSince(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-8 h-8 border-2 border-[#e8002d] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-mono">Connecting to timing feed…</p>
      </div>
    )
  }

  if (liveBlocked) {
    return (
      <div className="text-center py-20 px-6 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8002d]/10 border border-[#e8002d]/30 text-[#e8002d] text-xs font-mono uppercase tracking-widest mb-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8002d] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e8002d]" />
          </span>
          Race in Progress
        </div>
        <p className="text-white text-base font-semibold">Live data temporarily restricted</p>
        <p className="text-white/55 text-sm max-w-sm mx-auto leading-relaxed">
          OpenF1 limits free API access during active sessions. Timing data will load automatically once the session ends.
        </p>
        <button
          onClick={fetchData}
          className="mt-2 text-[#e8002d] text-xs font-mono underline underline-offset-2"
        >
          Check again
        </button>
        <p className="text-white/25 text-[10px] font-mono pt-2">Auto-retrying every 30s</p>
      </div>
    )
  }

  if (fetchError || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60 text-sm mb-2">Could not reach timing feed.</p>
        <button
          onClick={fetchData}
          className="text-[#e8002d] text-xs font-mono underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    )
  }

  const noTiming = data.timing.length === 0

  return (
    <div className="w-full space-y-5">

      {/* ── Session header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <LiveBadge isLive={data.isLive} />
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
              {data.year} · {data.sessionName}
            </span>
          </div>
          <h2
            className="text-xl md:text-2xl text-white"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {data.meetingName || data.circuit}
          </h2>
          <p className="text-white/50 text-sm mt-0.5">{data.country} · {data.circuit}</p>
        </div>

        {/* Weather */}
        {data.weather && (
          <div className="flex items-center gap-4 rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-3 text-xs font-mono shrink-0">
            <div className="text-center">
              <p className="text-white/40 uppercase tracking-widest text-[9px] mb-0.5">Track</p>
              <p className="text-white">{data.weather.trackTemp}°C</p>
            </div>
            <div className="w-px h-6 bg-[#1a1a1a]" />
            <div className="text-center">
              <p className="text-white/40 uppercase tracking-widest text-[9px] mb-0.5">Air</p>
              <p className="text-white">{data.weather.airTemp}°C</p>
            </div>
            <div className="w-px h-6 bg-[#1a1a1a]" />
            <div className="text-center">
              <p className="text-white/40 uppercase tracking-widest text-[9px] mb-0.5">Wind</p>
              <p className="text-white">{data.weather.windSpeed} km/h</p>
            </div>
            {data.weather.rainfall > 0 && (
              <>
                <div className="w-px h-6 bg-[#1a1a1a]" />
                <div className="text-center">
                  <p className="text-[#0080ff] uppercase tracking-widest text-[9px] mb-0.5">Rain</p>
                  <p className="text-[#0080ff]">●</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Main grid: timing tower + race control ─────────────────────── */}
      <div className="grid grid-cols-1 gap-5">

        {/* Timing tower */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden">
          {/* Column headers */}
          <div className="grid items-center border-b border-[#111111] px-3 py-2.5"
            style={{ gridTemplateColumns: '2rem 1fr 5rem 5rem 5rem 5rem' }}
          >
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest text-center">P</span>
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest pl-2">Driver</span>
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest text-center hidden sm:block">Gap</span>
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest text-center hidden md:block">Last Lap</span>
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest text-center hidden sm:block">Tyre</span>
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest text-center hidden md:block">Pits</span>
          </div>

          {noTiming ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-white/30 text-sm font-mono">Waiting for timing data…</p>
              <p className="text-white/20 text-xs font-mono">
                {data.isLive
                  ? 'Session is live — data arriving shortly'
                  : `Last session: ${data.sessionName}${data.meetingName ? ` · ${data.meetingName}` : ''}`}
              </p>
              <button
                onClick={fetchData}
                className="mt-3 text-[#e8002d] text-xs font-mono underline underline-offset-2"
              >
                Refresh now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#0d0d0d]">
              {data.timing.map((entry, i) => (
                <TimingRow key={entry.driverNumber} entry={entry} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Race control */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#111111]">
            <p className="text-white/40 text-[9px] font-mono uppercase tracking-widest">Race Control</p>
          </div>
          {data.raceControl.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-white/20 text-xs font-mono">No messages</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0d0d0d] max-h-[500px] overflow-y-auto">
              {data.raceControl.map((msg, i) => (
                <RaceControlRow key={i} msg={msg} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Last updated */}
      <p className="text-white/20 text-[10px] font-mono text-right">
        {data.isLive ? `Refreshes every 12s · ` : ''}
        Updated {secondsSince < 5 ? 'just now' : `${secondsSince}s ago`}
      </p>
    </div>
  )
}

// ── Timing row ─────────────────────────────────────────────────────────────────

function TimingRow({ entry, index }: { entry: TimingEntry; index: number }) {
  const teamHex = `#${entry.teamColor}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="grid items-center px-3 py-3 hover:bg-white/[0.02] transition-colors"
      style={{ gridTemplateColumns: '2rem 1fr 5rem 5rem 5rem 5rem' }}
    >
      {/* Position */}
      <span className="text-white font-mono font-bold text-sm tabular-nums text-center">
        {entry.position}
      </span>

      {/* Driver */}
      <div className="flex items-center gap-2.5 pl-2 min-w-0">
        <div className="w-0.5 h-7 rounded-full shrink-0" style={{ background: teamHex }} />
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-none mb-0.5 truncate">
            {entry.acronym}
          </p>
          <p className="text-white/50 text-[10px] font-mono truncate">{entry.name}</p>
        </div>
      </div>

      {/* Gap */}
      <span
        className={`text-xs font-mono tabular-nums text-center hidden sm:block ${
          entry.gap === 'LEADER' ? 'text-[#d4a017]' : 'text-white/75'
        }`}
      >
        {entry.gap}
      </span>

      {/* Last lap */}
      <span className="text-white/70 text-xs font-mono tabular-nums text-center hidden md:block">
        {entry.lastLap}
      </span>

      {/* Tyre */}
      <div className="hidden sm:flex justify-center">
        <TyreCompound compound={entry.compound} age={entry.tyreAge} />
      </div>

      {/* Pits */}
      <span className="text-white/50 text-xs font-mono tabular-nums text-center hidden md:block">
        {entry.pits > 0 ? entry.pits : '—'}
      </span>
    </motion.div>
  )
}

// ── Race control row ───────────────────────────────────────────────────────────

function RaceControlRow({ msg }: { msg: RCMessage }) {
  const time = new Date(msg.time)
  const hhmm = `${time.getUTCHours().toString().padStart(2, '0')}:${time.getUTCMinutes().toString().padStart(2, '0')}`

  const flagColor = msg.flag ? (FLAG_COLOR[msg.flag] ?? '#888888') : null
  const textColor = flagColor ?? '#cccccc'

  return (
    <div className="px-4 py-3 space-y-1">
      <div className="flex items-center gap-2">
        <RCFlag flag={msg.flag} />
        <span className="text-white/30 text-[9px] font-mono">{hhmm}</span>
        {msg.lap && (
          <span className="text-white/20 text-[9px] font-mono">LAP {msg.lap}</span>
        )}
      </div>
      <p className="text-xs leading-snug" style={{ color: textColor }}>
        {msg.message}
      </p>
    </div>
  )
}
