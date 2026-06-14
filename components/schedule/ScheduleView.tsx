'use client'

import { useState, useEffect } from 'react'
import type { Race } from '@/lib/f1api'

// ── Timezone options ───────────────────────────────────────────────────────────

const TIMEZONES = [
  { label: 'My Local Time', value: 'local' },
  { label: 'UTC (GMT)', value: 'UTC' },
  { label: 'London (GMT / BST)', value: 'Europe/London' },
  { label: 'Paris / Berlin (CET)', value: 'Europe/Paris' },
  { label: 'Cairo (EET)', value: 'Africa/Cairo' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
  { label: 'New York (ET)', value: 'America/New_York' },
  { label: 'Chicago (CT)', value: 'America/Chicago' },
  { label: 'Los Angeles (PT)', value: 'America/Los_Angeles' },
]

// ── Country flags ──────────────────────────────────────────────────────────────

const FLAGS: Record<string, string> = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦', 'United States': '🇺🇸', Monaco: '🇲🇨',
  Canada: '🇨🇦', Spain: '🇪🇸', Austria: '🇦🇹', UK: '🇬🇧',
  'Great Britain': '🇬🇧', Hungary: '🇭🇺', Belgium: '🇧🇪',
  Netherlands: '🇳🇱', Azerbaijan: '🇦🇿', Singapore: '🇸🇬',
  Italy: '🇮🇹', Mexico: '🇲🇽', Brazil: '🇧🇷',
  'United Arab Emirates': '🇦🇪', Qatar: '🇶🇦', France: '🇫🇷',
  Thailand: '🇹🇭', Portugal: '🇵🇹',
}

// ── Session color coding ───────────────────────────────────────────────────────

const SESSION_ACCENT: Record<string, string> = {
  Race: '#e8002d',
  Qualifying: '#ffd700',
  Sprint: '#43b02a',
  'Sprint Qualifying': '#43b02a',
  'Practice 1': '#444444',
  'Practice 2': '#444444',
  'Practice 3': '#444444',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolvedTz(value: string): string {
  if (value === 'local') return Intl.DateTimeFormat().resolvedOptions().timeZone
  return value
}

function getTzAbbr(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: tz }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value ?? tz
  } catch { return tz }
}

function formatTime(date: string, time?: string, tz: string = 'UTC'): { day: string; clock: string } {
  const iso = time ? `${date}T${time}` : `${date}T00:00:00Z`
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).format(d)
  const clock = time
    ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d)
    : 'TBC'
  return { day, clock }
}

function dateRange(sessions: { date: string }[], tz: string): string {
  const dates = sessions.map(s => s.date).sort()
  if (!dates.length) return ''
  const fmt = (d: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: tz }).format(new Date(`${d}T12:00:00Z`))
  if (dates[0] === dates[dates.length - 1]) return fmt(dates[0])
  const startFmt = fmt(dates[0])
  const endFmt = fmt(dates[dates.length - 1])
  // Same month → "13–15 Jun"
  const startMonth = startFmt.split(' ')[1]
  const endMonth = endFmt.split(' ')[1]
  if (startMonth === endMonth) return `${startFmt.split(' ')[0]}–${endFmt}`
  return `${startFmt} – ${endFmt}`
}

function buildSessions(race: Race) {
  const list: { name: string; date: string; time?: string }[] = []
  if (race.FirstPractice) list.push({ name: 'Practice 1', ...race.FirstPractice })
  if (race.SecondPractice) list.push({ name: 'Practice 2', ...race.SecondPractice })
  if (race.SprintQualifying) list.push({ name: 'Sprint Qualifying', ...race.SprintQualifying })
  if (race.ThirdPractice) list.push({ name: 'Practice 3', ...race.ThirdPractice })
  if (race.Sprint) list.push({ name: 'Sprint', ...race.Sprint })
  if (race.Qualifying) list.push({ name: 'Qualifying', ...race.Qualifying })
  list.push({ name: 'Race', date: race.date, time: race.time })
  return list
}

function getRaceStatus(race: Race): 'past' | 'next' | 'live' | 'upcoming' {
  const raceIso = race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`
  const raceEnd = new Date(raceIso).getTime() + 2.5 * 60 * 60 * 1000
  const now = Date.now()
  if (now > raceEnd) return 'past'
  if (now > new Date(raceIso).getTime()) return 'live'
  return 'upcoming'
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'past' | 'next' | 'live' | 'upcoming' }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e8002d]/15 border border-[#e8002d]/30 text-[#e8002d] text-[9px] font-mono uppercase tracking-widest">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8002d] opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e8002d]" />
      </span>
      Live
    </span>
  )
  if (status === 'next') return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#d4a017]/15 border border-[#d4a017]/30 text-[#d4a017] text-[9px] font-mono uppercase tracking-widest">
      Next Race
    </span>
  )
  if (status === 'past') return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/25 text-[9px] font-mono uppercase tracking-widest">
      Completed
    </span>
  )
  return null
}

function RoundCard({ race, status, tz }: { race: Race; status: 'past' | 'next' | 'live' | 'upcoming'; index: number; tz: string }) {
  const sessions = buildSessions(race)
  const country = race.Circuit.Location.country
  const flag = FLAGS[country] ?? '🏁'
  const isPast = status === 'past'
  const isNext = status === 'next' || status === 'live'
  const range = dateRange(sessions, tz)

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all ${isPast ? 'opacity-50' : ''}`}
      style={{
        background: '#060606',
        border: isNext ? '1px solid rgba(232,0,45,0.35)' : '1px solid #141414',
        boxShadow: isNext ? '0 0 0 1px rgba(232,0,45,0.08), 0 0 32px rgba(232,0,45,0.06)' : 'none',
      }}
    >
      {/* Round header */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex items-start gap-3">
          {/* Round number */}
          <span className="mt-0.5 text-[10px] font-mono text-white/25 shrink-0 w-14">
            RND {race.round.padStart(2, '0')}
          </span>
          {/* Race info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg leading-none">{flag}</span>
              <h2 className="text-white font-semibold text-base leading-snug">{race.raceName}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="text-white/40 text-xs mt-1 font-mono">
              {race.Circuit.circuitName} · {race.Circuit.Location.locality}, {country}
            </p>
          </div>
        </div>
        {/* Date range */}
        <span className="text-white/50 text-xs font-mono shrink-0 sm:mt-0.5">{range}</span>
      </div>

      {/* Session list */}
      <div className="border-t border-[#0f0f0f] divide-y divide-[#0a0a0a]">
        {sessions.map(s => {
          const { day, clock } = formatTime(s.date, s.time, tz)
          const accent = SESSION_ACCENT[s.name] ?? '#444444'
          const isRace = s.name === 'Race'
          return (
            <div
              key={s.name}
              className={`flex items-center justify-between px-5 py-2.5 ${isRace && !isPast ? 'bg-white/[0.02]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: accent }}
                />
                <span
                  className={`text-xs font-medium ${isRace && !isPast ? 'text-white' : 'text-white/60'}`}
                >
                  {s.name}
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white/40 text-[10px]">{day}</span>
                <span className={`ml-3 text-xs ${isRace && !isPast ? 'text-white font-semibold' : 'text-white/65'}`}>
                  {clock}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ScheduleView({ races }: { races: Race[] }) {
  // SSR-safe: start with 'local', hydrate after mount
  const [tzValue, setTzValue] = useState('local')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('f1rs-tz')
    if (saved) setTzValue(saved)
  }, [])

  const tz = mounted ? resolvedTz(tzValue) : 'UTC'
  const tzAbbr = mounted ? getTzAbbr(tz) : 'UTC'

  // Determine statuses
  const statuses = races.map(r => getRaceStatus(r))
  // First 'upcoming' → 'next'
  const nextIdx = statuses.findIndex(s => s === 'upcoming')
  if (nextIdx !== -1) statuses[nextIdx] = 'next'

  return (
    <div className="w-full">
      {/* Timezone selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <p className="text-white/60 text-sm">
            All times in{' '}
            <span className="text-white font-semibold">{tzAbbr}</span>
          </p>
        </div>
        <div className="relative">
          <select
            value={tzValue}
            onChange={e => {
              setTzValue(e.target.value)
              localStorage.setItem('f1rs-tz', e.target.value)
            }}
            className="appearance-none bg-[#0d0d0d] border border-[#222222] text-white text-sm rounded-xl px-4 py-2.5 pr-9 font-mono focus:outline-none focus:border-[#e8002d]/40 cursor-pointer"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"
            width="12" height="12" viewBox="0 0 12 12" fill="none"
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Race cards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {races.map((race, i) => (
          <RoundCard
            key={race.round}
            race={race}
            status={statuses[i]}
            index={i}
            tz={tz}
          />
        ))}
      </div>

      {races.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-white/30 text-sm font-mono">Schedule not yet available</p>
        </div>
      )}
    </div>
  )
}
