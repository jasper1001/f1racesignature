'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Race } from '@/lib/f1api'
import type { CircuitFacts } from '@/lib/circuitFacts'
import { ArrowRightIcon } from '@/components/ui/ArrowRightIcon'
import { FlagIcon } from '@/components/ui/FlagIcon'

// ── Session model ────────────────────────────────────────────────────────────

interface Session {
  name: string
  short: string
  date: string
  time?: string
  accent: string
  isRace?: boolean
}

function buildSessions(race: Race): Session[] {
  const list: Session[] = []
  const grey = '#8a8a8a'
  if (race.FirstPractice) list.push({ name: 'Practice 1', short: 'FP1', ...race.FirstPractice, accent: grey })
  if (race.SecondPractice) list.push({ name: 'Practice 2', short: 'FP2', ...race.SecondPractice, accent: grey })
  if (race.SprintQualifying) list.push({ name: 'Sprint Qualifying', short: 'SQ', ...race.SprintQualifying, accent: '#43b02a' })
  if (race.ThirdPractice) list.push({ name: 'Practice 3', short: 'FP3', ...race.ThirdPractice, accent: grey })
  if (race.Sprint) list.push({ name: 'Sprint', short: 'SPR', ...race.Sprint, accent: '#43b02a' })
  if (race.Qualifying) list.push({ name: 'Qualifying', short: 'QUA', ...race.Qualifying, accent: '#ffd700' })
  list.push({ name: 'Race', short: 'RAC', date: race.date, time: race.time, accent: '#e8002d', isRace: true })
  return list
}

// ── Time helpers ─────────────────────────────────────────────────────────────

function fmt(date: string, time: string | undefined, tz: string): { day: string; clock: string } {
  const iso = time ? `${date}T${time}` : `${date}T00:00:00Z`
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).format(d)
  const clock = time
    ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d)
    : 'TBC'
  return { day, clock }
}

function tzOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz
  } catch {
    return tz
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

// ── Countdown ────────────────────────────────────────────────────────────────

function CountdownBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 px-1">
      <span className="text-white text-2xl sm:text-4xl font-mono font-bold tabular-nums leading-none">{value}</span>
      <span className="text-white/50 text-[9px] font-mono uppercase tracking-widest mt-2">{label}</span>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  race: Race
  round: number
  totalRounds: number
  facts: CircuitFacts | null
  trackTz: string | null
  posterHref?: string
  posterLabel?: string
}

export function NextRaceHero({ race, round, totalRounds, facts, trackTz, posterHref, posterLabel }: Props) {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(0)
  const [localTz, setLocalTz] = useState('UTC')

  useEffect(() => {
    setMounted(true)
    setLocalTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const title = race.raceName.replace(/\s*Grand Prix\s*/i, '').trim() || race.raceName
  const sessions = buildSessions(race)

  const raceTs = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`).getTime()
  const remaining = Math.max(0, raceTs - now)
  const total = Math.floor(remaining / 1000)
  const cd = {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }

  const tz = mounted ? localTz : 'UTC'
  const yourOffset = mounted ? tzOffsetLabel(tz) : ''
  const trackOffset = trackTz ? tzOffsetLabel(trackTz) : null

  const raceDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${race.date}T12:00:00Z`))

  return (
    <section className="relative border-b border-[#0f0f0f] overflow-hidden">
      {/* Diagonal speed lines + gold glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(115deg, #e8002d 0 1px, transparent 1px 34px)' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 30%, rgba(212,160,23,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12">

          {/* ── Left: headline + stats + countdown ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#d4a017] text-[11px] font-mono uppercase tracking-[0.2em]">Next Race</p>
              <p className="text-white/40 text-[11px] font-mono uppercase tracking-widest">
                Round {round}/{totalRounds}
              </p>
            </div>

            <h1 className="text-white font-display leading-[0.9] mb-3 break-words">
              <span className="uppercase" style={{ fontSize: 'clamp(2.75rem, 12vw, 6rem)' }}>{title}</span>
              <span className="text-[#e8002d]" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>.</span>
            </h1>

            <p className="flex flex-wrap items-center gap-2 text-white/70 text-sm mb-6">
              <FlagIcon country={race.Circuit.Location.country} className="h-4 w-6" />
              <span className="font-medium text-white/85">{race.Circuit.circuitName}</span>
              <span className="text-white/25">·</span>
              <span className="font-mono">{raceDate}</span>
            </p>

            {/* Circuit stat boxes */}
            {facts && (
              <div className="flex flex-wrap gap-2.5 mb-7">
                {[
                  { label: 'Length', value: (facts.lengthM / 1000).toFixed(3), unit: 'km' },
                  { label: 'Laps', value: String(facts.laps), unit: '' },
                  { label: 'Corners', value: String(facts.corners), unit: '' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-2.5">
                    <p className="text-white/45 text-[9px] font-mono uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-white font-mono text-lg leading-none">
                      {s.value}
                      {s.unit && <span className="text-white/45 text-xs ml-1">{s.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Countdown */}
            <p className="text-white/45 text-[10px] font-mono uppercase tracking-widest mb-2.5">Lights out in</p>
            <div className="grid grid-cols-4 gap-2.5 max-w-md mb-7">
              <CountdownBox value={mounted ? String(cd.d) : '—'} label="Days" />
              <CountdownBox value={mounted ? pad(cd.h) : '—'} label="Hours" />
              <CountdownBox value={mounted ? pad(cd.m) : '—'} label="Mins" />
              <CountdownBox value={mounted ? pad(cd.s) : '—'} label="Secs" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {posterHref && (
                <Link
                  href={posterHref}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4a017] text-black text-sm font-semibold hover:bg-[#e8b84b] transition-colors"
                >
                  {posterLabel ?? 'Create a poster'}
                  <ArrowRightIcon size={14} strokeWidth={1.5} />
                </Link>
              )}
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-white text-sm font-medium border border-white/10 hover:bg-white/8 transition-colors"
              >
                Full schedule
                <ArrowRightIcon size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* ── Right: session schedule table ── */}
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#070707] overflow-hidden self-start">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#141414]">
              <p className="text-white/70 text-[11px] font-mono uppercase tracking-widest">Session Schedule</p>
              <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-wider">
                <span className="text-[#d4a017]">Your time{yourOffset && ` (${yourOffset})`}</span>
                {trackOffset && <span className="text-white/40 hidden sm:inline">Track ({trackOffset})</span>}
              </div>
            </div>

            <div className="divide-y divide-[#0e0e0e]">
              {sessions.map((s, idx) => {
                const you = fmt(s.date, s.time, tz)
                const track = trackTz ? fmt(s.date, s.time, trackTz) : null
                return (
                  <div
                    key={`${s.name}-${idx}`}
                    className={`flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 ${s.isRace ? 'bg-white/[0.025]' : ''}`}
                  >
                    <span className="text-white/30 text-[10px] font-mono w-5 shrink-0">{pad(idx + 1)}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.accent }} />
                    <span className={`flex-1 min-w-0 truncate text-xs font-medium ${s.isRace ? 'text-white' : 'text-white/75'}`}>
                      {s.name}
                    </span>
                    <div className="text-right font-mono shrink-0">
                      <span className={`text-xs whitespace-nowrap ${s.isRace ? 'text-white font-semibold' : 'text-white/75'}`}>
                        {mounted ? `${you.day} ${you.clock}` : '—'}
                      </span>
                    </div>
                    {track && (
                      <div className="text-right font-mono shrink-0 w-20 hidden sm:block">
                        <span className="text-white/40 text-xs">{track.day.split(' ')[0]} {track.clock}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {facts?.lapRecord && (
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-[#141414] bg-[#050505]">
                <span className="text-white/45 text-[10px] font-mono uppercase tracking-widest shrink-0">Lap Record</span>
                <span className="text-white/80 text-xs font-mono min-w-0 truncate text-right">
                  {facts.lapRecord.driver} · <span className="text-white">{facts.lapRecord.time}</span>{' '}
                  <span className="text-white/40">({facts.lapRecord.year})</span>
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
