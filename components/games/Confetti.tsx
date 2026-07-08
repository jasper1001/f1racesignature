'use client'

import { useEffect, useState } from 'react'

// ── One-shot celebration confetti ───────────────────────────────────────────────
// Mount this (typically alongside a "New Personal Best" badge) and it fires a
// single burst that falls off-screen and rests. It plays once per mount, so games
// that gate it on a best-score flag get a fresh burst each time a record is set.
// Pure CSS animation (keyframes live in globals.css) — no deps, CSP-safe, and it
// vanishes entirely for `prefers-reduced-motion` users.

const COLORS = ['#d4a017', '#e8002d', '#3b82f6', '#10b981', '#a855f7', '#f97316', '#f5f5f5']

interface Piece {
  i: number; left: number; size: number; height: number; round: boolean
  color: string; drift: number; rot: number; delay: number; duration: number
}

export function Confetti({ count = 90, accent }: { count?: number; accent?: string }) {
  // Generate the randomised pieces after mount — keeps render pure and avoids any
  // server/client mismatch (the burst is a purely client-side celebration anyway).
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    const palette = accent ? [accent, ...COLORS] : COLORS
    setPieces(
      Array.from({ length: count }, (_, i) => {
        const size = 6 + Math.random() * 6
        return {
          i,
          left: Math.random() * 100,
          size,
          height: size * (Math.random() > 0.5 ? 1 : 1.7),
          round: Math.random() > 0.55,
          color: palette[i % palette.length],
          drift: (Math.random() - 0.5) * 260,
          rot: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
          delay: Math.random() * 0.35,
          duration: 2.4 + Math.random() * 1.6,
        }
      }),
    )
  }, [count, accent])

  if (pieces.length === 0) return null

  return (
    <div className="rs-confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="rs-confetti-piece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.height}px`,
            background: p.color,
            borderRadius: p.round ? '50%' : '1px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--rs-drift' as string]: `${p.drift}px`,
            ['--rs-rot' as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}
