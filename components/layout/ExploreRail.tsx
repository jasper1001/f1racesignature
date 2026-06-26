'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface Feature {
  label: string
  href: string
  desc: string
  icon: React.ReactNode
}

const FEATURES: Feature[] = [
  {
    label: 'Studio',
    href: '/studio',
    desc: 'Create poster art',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Mini Games',
    href: '/games',
    desc: 'Play free F1 games',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 12h4 M8 10v4 M15 11h.01 M18 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="6" width="20" height="12" rx="4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Blog',
    href: '/blog',
    desc: 'F1 articles & analysis',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Schedule',
    href: '/schedule',
    desc: '2026 race calendar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 9h18 M8 3v4 M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: '2026 Season',
    href: '/results',
    desc: 'Live standings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9a6 6 0 0 0 12 0V3H6v6z M9 21h6 M12 15v6 M6 5H3v2a3 3 0 0 0 3 3 M18 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Support on Ko-fi',
    href: 'https://ko-fi.com/jascodingvibes',
    desc: 'Help fund the project',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5h13a3 3 0 0 1 0 6h-1M4 5v8a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 2v1.5M10 2v1.5M13 2v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function ExploreRail() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Devices with a real pointer get hover-to-open; touch devices use tap-to-toggle.
  const [canHover, setCanHover] = useState(false)
  // Once the user interacts with the handle, stop the auto-open/close from overriding them.
  const interacted = useRef(false)

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  // On first load (desktop only): slide open to draw attention, then auto-close.
  // On mobile the chevron stays accessible but the panel never auto-opens.
  useEffect(() => {
    if (pathname.startsWith('/studio')) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const openTimer = setTimeout(() => { if (!interacted.current) setOpen(true) }, 600)
    const closeTimer = setTimeout(() => { if (!interacted.current) setOpen(false) }, 5000)
    return () => { clearTimeout(openTimer); clearTimeout(closeTimer) }
  }, [pathname])

  const toggle = () => {
    interacted.current = true
    setOpen((o) => !o)
  }

  // Never show on the Studio page
  if (pathname.startsWith('/studio')) return null

  // Hide the feature whose page we're already on
  const items = FEATURES.filter((f) => !pathname.startsWith(f.href))
  if (items.length === 0) return null

  // The rail overlaps game interactions on small screens — hide it on mobile
  // for the games section (keeps it on tablet/desktop).
  const onGames = pathname.startsWith('/games')

  return (
    <>
      {/* Mobile dismiss backdrop — tap anywhere to close */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 sm:hidden"
          aria-hidden="true"
        />
      )}

      <div
        onMouseEnter={canHover ? () => { interacted.current = true; setOpen(true) } : undefined}
        onMouseLeave={canHover ? () => setOpen(false) : undefined}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 items-stretch ${onGames ? 'hidden sm:flex' : 'flex'}`}
      >
      {/* Sliding panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? 'max-w-[220px] opacity-100' : 'max-w-0 opacity-0'
        }`}
      >
        <div className="w-[196px] rounded-l-2xl border border-r-0 border-[#d4a017]/40 bg-[#0a0a0a]/95 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-2.5">
          <p
            className="px-2.5 pt-1.5 pb-3 text-base text-white"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontStyle: 'italic' }}
          >
            Explore
          </p>
          <nav className="flex flex-col gap-1.5">
            {items.map((f) => (
              <a
                key={f.href}
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-white/65 group-hover:text-[#d4a017] transition-colors shrink-0">
                  {f.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{f.label}</span>
                  <span className="block text-[10px] text-white/65 font-mono leading-tight mt-1 truncate">
                    {f.desc}
                  </span>
                </span>
              </a>
            ))}
          </nav>
          <p className="px-2.5 pt-3 mt-1 border-t border-white/[0.06] text-[9px] font-mono uppercase tracking-[0.15em] text-white/25">
            f1racesignature.site
          </p>
        </div>
      </div>

      {/* Handle / toggle tab */}
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Close explore menu' : 'Open explore menu'}
        className="flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-l-xl border border-r-0 border-[#d4a017]/40 bg-[#0a0a0a]/95 backdrop-blur-md text-white/70 hover:text-white hover:border-[#d4a017]/60 transition-colors cursor-pointer self-center shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
      >
        {/* Chevron points left to open, right to close */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span
          className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#d4a017]"
          style={{ writingMode: 'vertical-rl' }}
        >
          Explore
        </span>
      </button>
      </div>
    </>
  )
}
