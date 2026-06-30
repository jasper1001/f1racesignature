'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SteeringWheelIcon } from '@/components/icons/SteeringWheel'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/studio', label: 'Studio' },
  { href: '/games', label: 'Mini Games' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/blog', label: 'Blog' },
  { href: '/garage', label: 'My Garage' },
  { href: '/results', label: '2026 Season' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/calendar', label: 'Calendar' },
]

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#030303]/90 backdrop-blur-md border-b border-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMenuOpen(false)}>
            <SteeringWheelIcon className="w-7 h-7 text-[#d4a017] group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-white font-semibold tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              F1Race<span className="text-[#d4a017]">Signature</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors rounded-lg ${
                    active ? 'text-white' : 'text-[#aaaaaa] hover:text-[#aaaaaa]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/5 border border-[#222222] rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {link.label}
                  </span>
                </Link>
              )
            })}
            {pathname !== '/studio' && !pathname.startsWith('/games') && (
              <Link href="/studio" className="ml-2 px-4 py-1.5 text-sm font-medium bg-[#d4a017] text-black rounded-lg hover:bg-[#e8b84b] transition-colors">
                Create Poster
              </Link>
            )}
          </nav>

          {/* Mobile: Create Poster + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {pathname !== '/studio' && !pathname.startsWith('/games') && (
              <Link href="/studio" className="px-3 py-1.5 text-xs font-medium bg-[#d4a017] text-black rounded-lg hover:bg-[#e8b84b] transition-colors">
                Create
              </Link>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 text-[#aaaaaa] hover:text-white transition-colors"
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-14 left-0 right-0 z-39 bg-[#030303]/95 backdrop-blur-md border-b border-[#111111] md:hidden"
          >
            <nav className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-white/8 text-white border border-[#222222]'
                      : 'text-[#aaaaaa] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
