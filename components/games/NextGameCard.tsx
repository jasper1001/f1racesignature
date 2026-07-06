'use client'

import Link from 'next/link'
import { getNextGame } from '@/lib/games/registry'

// ── "Next Game" suggestion shown after a game ends ──────────────────────────────
// Keeps players in the games loop by surfacing a different game to try next.
// Pure UI — styled to match the parchment / per-game accent system.

export function NextGameCard({ currentId }: { currentId: string }) {
  const next = getNextGame(currentId)

  return (
    <div className="pt-2">
      <p className="text-[#1a1712]/45 text-[10px] font-mono uppercase tracking-widest mb-2 text-center">
        Up Next
      </p>
      <Link
        href={next.href}
        className="group relative flex items-center gap-4 rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-4 transition-all duration-300 overflow-hidden hover:border-[#c4bca8] hover:-translate-y-0.5 hover:shadow-lg"
      >
        {/* Left accent stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{ background: next.accent }}
        />
        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 60% at 0% 50%, ${next.accent}14 0%, transparent 65%)` }}
        />

        {/* Icon */}
        <span
          className="relative inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0"
          style={{ background: `${next.accent}15`, border: `1px solid ${next.accent}25` }}
        >
          {next.icon}
        </span>

        {/* Text */}
        <div className="relative min-w-0 flex-1">
          <p
            className="text-[10px] font-mono uppercase tracking-widest font-semibold mb-0.5"
            style={{ color: next.accent }}
          >
            {next.tag}
          </p>
          <h3
            className="text-lg text-[#1a1712] leading-tight font-display"
          >
            {next.title}
          </h3>
          <p className="text-[#1a1712]/65 text-xs leading-snug mt-0.5">{next.blurb}</p>
        </div>

        {/* Play affordance */}
        <span
          className="relative inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: next.accent }}
        >
          Play
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </div>
  )
}
