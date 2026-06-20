'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Race } from '@/lib/f1api'

// ── Timezone options ───────────────────────────────────────────────────────────

const TIMEZONES = [
  { label: 'My Local Time', value: 'local' },
  { label: 'UTC (GMT)', value: 'UTC' },
  { label: 'New York (ET)', value: 'America/New_York' },
  { label: 'Los Angeles (PT)', value: 'America/Los_Angeles' },
  { label: 'London (GMT / BST)', value: 'Europe/London' },
  { label: 'Paris / Berlin (CET)', value: 'Europe/Paris' },
  { label: 'Cairo (EET)', value: 'Africa/Cairo' },
  { label: 'Riyadh / Bahrain (AST)', value: 'Asia/Riyadh' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Mumbai / New Delhi (IST)', value: 'Asia/Kolkata' },
  { label: 'Kuala Lumpur (MYT)', value: 'Asia/Kuala_Lumpur' },
  { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Shanghai / Beijing (CST)', value: 'Asia/Shanghai' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
  { label: 'Mexico City (CST)', value: 'America/Mexico_City' },
  { label: 'Chicago (CT)', value: 'America/Chicago' },
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
  'Grand Prix': '#e8002d',
  Qualifying: '#ffd700',
  Sprint: '#43b02a',
  'Sprint Qualifying': '#43b02a',
  'Free Practice 1': '#444444',
  'Free Practice 2': '#444444',
  'Free Practice 3': '#444444',
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
  if (race.FirstPractice) list.push({ name: 'Free Practice 1', ...race.FirstPractice })
  if (race.SecondPractice) list.push({ name: 'Free Practice 2', ...race.SecondPractice })
  if (race.SprintQualifying) list.push({ name: 'Sprint Qualifying', ...race.SprintQualifying })
  if (race.ThirdPractice) list.push({ name: 'Free Practice 3', ...race.ThirdPractice })
  if (race.Sprint) list.push({ name: 'Sprint', ...race.Sprint })
  if (race.Qualifying) list.push({ name: 'Qualifying', ...race.Qualifying })
  list.push({ name: 'Grand Prix', date: race.date, time: race.time })
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

interface TimedSession { sessionName: string; date: string; time: string; ts: number }

// The upcoming sessions of the NEXT race weekend, in order, ending at the Race.
// We anchor on the earliest race that still has any session ahead of `now`, then
// return that weekend's remaining sessions — this is the list the countdown cycles through.
function nextWeekendSessions(races: Race[], now: number): { raceName: string; sessions: TimedSession[] } | null {
  const byRace = races
    .map(race => ({
      raceName: race.raceName,
      sessions: buildSessions(race)
        .filter((s): s is { name: string; date: string; time: string } => Boolean(s.time))
        .map(s => ({ sessionName: s.name, date: s.date, time: s.time, ts: new Date(`${s.date}T${s.time}`).getTime() }))
        .filter(s => !Number.isNaN(s.ts) && s.ts > now)
        .sort((a, b) => a.ts - b.ts),
    }))
    .filter(r => r.sessions.length > 0)
    .sort((a, b) => a.sessions[0].ts - b.sessions[0].ts)

  return byRace[0] ?? null
}

const pad = (n: number) => String(n).padStart(2, '0')

function splitCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

// ── Countdown to the next session across the entire calendar ─────────────────────

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[40px] sm:min-w-[48px]">
      <span className="text-white text-2xl sm:text-3xl font-mono tabular-nums leading-none">{value}</span>
      <span className="text-white/65 text-[9px] font-mono uppercase tracking-widest mt-1.5">{label}</span>
    </div>
  )
}

function NextSessionCountdown({ races, tz, tzAbbr, mounted }: { races: Race[]; tz: string; tzAbbr: string; mounted: boolean }) {
  const [now, setNow] = useState(0)
  // Which session in the upcoming weekend the user has clicked through to (0 = the next one).
  const [sessionIdx, setSessionIdx] = useState(0)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const weekend = useMemo(() => (now === 0 ? null : nextWeekendSessions(races, now)), [races, now])

  // Render a stable placeholder until mounted to avoid hydration mismatch on time-based content.
  if (!mounted || now === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 sm:px-6 sm:py-6 mb-6 min-h-[96px]">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#d4a017] mb-1.5">Next Session</p>
        <p className="text-white/65 text-sm font-mono">Calculating…</p>
      </div>
    )
  }

  if (!weekend || weekend.sessions.length === 0) return null // season complete — nothing to count down to

  const cycle = weekend.sessions
  const idx = sessionIdx % cycle.length // modulo keeps it valid as sessions pass / on wrap-around
  const current = cycle[idx]
  const advance = () => setSessionIdx(i => (i + 1) % cycle.length)

  const { d, h, m, s } = splitCountdown(current.ts - now)
  const raceLabel = weekend.raceName.replace('Grand Prix', 'GP')
  const when = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
  }).format(new Date(`${current.date}T${current.time}`))

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={advance}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance() }
      }}
      aria-label={`${raceLabel} ${current.sessionName} countdown. Tap to view the next session.`}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm px-5 py-5 sm:px-6 sm:py-6 mb-6 cursor-pointer select-none transition-colors hover:border-[#d4a017]/30 hover:bg-white/[0.035] focus:outline-none focus-visible:border-[#d4a017]/40"
    >
      {/* Tooltip — appears on hover / keyboard focus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-3 right-3 z-10 rounded-lg border border-[#d4a017]/25 bg-[#0d0d0d]/95 px-2.5 py-1.5 text-[10px] font-mono text-white/80 whitespace-nowrap shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0"
      >
        Click to see the next session →
      </span>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 90% at 100% 0%, rgba(212,160,23,0.07) 0%, transparent 70%)' }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#d4a017] mb-1.5">{raceLabel}</p>
          <h2
            className="text-white font-semibold text-lg sm:text-xl leading-snug truncate"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            {current.sessionName}
          </h2>
          <p className="text-white/65 text-xs font-mono mt-1">{when} · {tzAbbr}</p>

          {/* Session progress dots + tap hint */}
          <div className="flex items-center gap-2.5 mt-3">
            <div className="flex items-center gap-1.5">
              {cycle.map((sess, i) => (
                <span
                  key={sess.sessionName}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-[#d4a017]' : 'w-1.5 bg-white/20'}`}
                />
              ))}
            </div>
            <span className="text-white/25 text-[9px] font-mono uppercase tracking-widest">Tap for next ›</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <CountdownUnit value={String(d)} label="Days" />
          <span className="text-white/15 text-2xl font-mono leading-none -mt-3">:</span>
          <CountdownUnit value={pad(h)} label="Hrs" />
          <span className="text-white/15 text-2xl font-mono leading-none -mt-3">:</span>
          <CountdownUnit value={pad(m)} label="Min" />
          <span className="text-white/15 text-2xl font-mono leading-none -mt-3">:</span>
          <CountdownUnit value={pad(s)} label="Sec" />
        </div>
      </div>
    </div>
  )
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
            <p className="text-white/65 text-xs mt-1 font-mono">
              {race.Circuit.circuitName} · {race.Circuit.Location.locality}, {country}
            </p>
          </div>
        </div>
        {/* Date range */}
        <span className="text-white/65 text-xs font-mono shrink-0 sm:mt-0.5">{range}</span>
      </div>

      {/* Session list */}
      <div className="border-t border-[#0f0f0f] divide-y divide-[#0a0a0a]">
        {sessions.map(s => {
          const { day, clock } = formatTime(s.date, s.time, tz)
          const accent = SESSION_ACCENT[s.name] ?? '#444444'
          const isRace = s.name === 'Grand Prix'
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
                  className={`text-xs font-medium ${isRace && !isPast ? 'text-white' : 'text-white/65'}`}
                >
                  {s.name}
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white/65 text-[10px]">{day}</span>
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
  const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming')

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

  // Pair each race with its status, then split into upcoming/completed buckets.
  // 'past' = the Race session has finished; everything else is upcoming (incl. next/live).
  const pairs = races.map((race, i) => ({ race, status: statuses[i], index: i }))
  const counts = {
    upcoming: pairs.filter(p => p.status !== 'past').length,
    completed: pairs.filter(p => p.status === 'past').length,
  }
  const filteredPairs = pairs.filter(p => (filter === 'completed' ? p.status === 'past' : p.status !== 'past'))
  // Before mount, render the full list so SSR and first client render match (no node-count mismatch).
  const visible = mounted ? filteredPairs : pairs

  return (
    <div className="w-full">
      {/* Countdown to the next session across the whole calendar */}
      <NextSessionCountdown races={races} tz={tz} tzAbbr={tzAbbr} mounted={mounted} />

      {/* Timezone selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <p className="text-white/65 text-sm">
            All times in{' '}
            <span className="text-white font-semibold">{tzAbbr}</span>
          </p>
          <p className="text-white/65 text-[11px] mt-1">
            View times in ET, PT, IST, CET and more — choose your timezone →
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
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/65"
            width="12" height="12" viewBox="0 0 12 12" fill="none"
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center gap-1 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-1">
          {(['upcoming', 'completed'] as const).map(f => {
            const active = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                    : 'text-white/65 hover:text-white/70'
                }`}
              >
                {f === 'upcoming' ? 'Upcoming' : 'Completed'}
                {mounted && (
                  <span className={`ml-1.5 text-[10px] font-mono ${active ? 'text-[#d4a017]' : 'text-white/25'}`}>
                    {counts[f]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Race cards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {visible.map(({ race, status, index }) => (
          <RoundCard
            key={race.round}
            race={race}
            status={status}
            index={index}
            tz={tz}
          />
        ))}
      </div>

      {races.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-white/65 text-sm font-mono">Schedule not yet available</p>
        </div>
      )}

      {races.length > 0 && mounted && visible.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-white/65 text-sm font-mono">
            {filter === 'completed' ? 'No races completed yet this season.' : 'No upcoming races remaining.'}
          </p>
        </div>
      )}
    </div>
  )
}
