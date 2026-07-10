'use client'

import { useState, useEffect, useRef } from 'react'

// A rotating strip of real F1 trivia — the amber "Did You Know" banner that
// leads the race hub. Auto-advances every ~7s with a pause toggle.
const FACTS = [
  "Vanwall won the first ever F1 Constructors' Championship in 1958, the year the title was introduced.",
  'Ayrton Senna took 65 pole positions from just 162 starts — a strike rate no driver has matched since.',
  'The 1950 British Grand Prix at Silverstone was the very first round of the Formula 1 World Championship.',
  'Lewis Hamilton and Michael Schumacher share the record for most world titles, with seven each.',
  'Monaco is the slowest circuit on the calendar, yet drivers still average over 160 km/h around it.',
  'At Monza, cars spend roughly 80% of the lap at full throttle — the highest of any track.',
  "Fernando Alonso's F1 career has spanned more than two decades and over 400 Grand Prix starts.",
  'A modern F1 car can decelerate from 300 to 0 km/h in around four seconds and 130 metres.',
  'Eau Rouge–Raidillon at Spa climbs nearly 40 metres in elevation across a single flat-out sequence.',
  'The fastest pit stops in F1 now take under two seconds — quicker than a blink is deliberate.',
  'Max Verstappen won a record 19 Grands Prix in the 2023 season alone.',
  'Ferrari is the only team to have competed in every Formula 1 World Championship season since 1950.',
  'Jim Clark led every single lap of the 1965 season openers — total domination in a Lotus.',
  'DRS (the Drag Reduction System) was introduced in 2011 to help cars follow and overtake.',
  'Kimi Räikkönen holds the record for the most career fastest laps, with 46.',
]

export function FactTicker() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => setI((n) => (n + 1) % FACTS.length), 7000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [paused])

  return (
    <div className="relative z-30 border-b border-[#d4a017]/20 bg-gradient-to-r from-[#0a0a0a] via-[#12100a] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-2 shrink-0 px-2.5 py-1 rounded-md bg-[#d4a017] text-black text-[10px] font-mono font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-black/70" />
          Did You Know
        </span>

        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Resume facts' : 'Pause facts'}
          className="shrink-0 flex items-center justify-center w-6 h-6 rounded border border-[#d4a017]/30 text-[#d4a017] hover:bg-[#d4a017]/10 transition-colors"
        >
          {paused ? (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
              <path d="M1 0.5v8l7-4z" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
              <rect x="1" y="0.5" width="2.5" height="8" />
              <rect x="5.5" y="0.5" width="2.5" height="8" />
            </svg>
          )}
        </button>

        <p
          key={i}
          className="fact-fade min-w-0 truncate text-[#d4a017] text-xs sm:text-[13px] font-mono"
          title={FACTS[i]}
        >
          {FACTS[i]}
        </p>
      </div>

      <style>{`
        @keyframes factFade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
        .fact-fade { animation: factFade 0.5s ease both; }
      `}</style>
    </div>
  )
}
