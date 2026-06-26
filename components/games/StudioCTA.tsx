'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

const PLAYED_KEY = 'f1rs_games_played'
const DISMISS_KEY = 'f1rs_studio_cta_seen'
const MIN_GAMES = 2

function readPlayed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(PLAYED_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Records a distinct game visit and returns the new count. */
function recordGame(id: string): number {
  try {
    const played = readPlayed()
    if (!played.includes(id)) {
      played.push(id)
      sessionStorage.setItem(PLAYED_KEY, JSON.stringify(played))
    }
    return played.length
  } catch {
    return 0
  }
}

// ── Studio bridge CTA ───────────────────────────────────────────────────────────
// Mounted once via the /games layout. Tracks how many distinct games a visitor has
// opened this session (from the URL) and, after 2+, slides up a non-blocking glass
// card nudging them toward the core product (poster studio). Shows once per session
// and is dismissible.

export function StudioCTA() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // A single game page looks like /games/<id> (the hub is just /games).
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] !== 'games' || segments.length < 2) return

    const count = recordGame(segments[1])

    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return
    } catch {
      return
    }
    if (count >= MIN_GAMES) setVisible(true)
  }, [pathname])

  function close(persist: boolean) {
    setVisible(false)
    if (persist) {
      try {
        sessionStorage.setItem(DISMISS_KEY, '1')
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pointer-events-none flex justify-center"
        >
          <div
            className="pointer-events-auto relative w-full max-w-md rounded-2xl border p-5 pr-10 overflow-hidden"
            style={{
              background: 'rgba(251,249,244,0.82)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderColor: 'rgba(212,160,23,0.35)',
              boxShadow: '0 12px 40px rgba(26,23,18,0.18), 0 0 0 1px rgba(212,160,23,0.08)',
            }}
          >
            {/* Gold corner glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(212,160,23,0.12) 0%, transparent 65%)' }}
            />

            {/* Dismiss */}
            <button
              onClick={() => close(true)}
              aria-label="Dismiss"
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-[#1a1712]/45 hover:text-[#1a1712] hover:bg-[#1a1712]/5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="relative">
              <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-1.5">
                From the makers
              </p>
              <p
                className="text-[#1a1712] text-lg leading-snug mb-3"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                You know your F1. Now see your favourite driver&apos;s data as art.
              </p>
              <Link
                href="/studio"
                onClick={() => close(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4a017] text-black text-sm font-semibold hover:bg-[#e8b84b] transition-all active:scale-95"
              >
                Create Your Poster
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
