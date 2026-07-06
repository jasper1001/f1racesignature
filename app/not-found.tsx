import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

const DESTINATIONS = [
  { href: '/studio', label: 'Open the Studio', desc: 'Turn a legendary lap into poster art' },
  { href: '/games', label: 'Play Mini Games', desc: 'Reaction tests, quizzes and circuit puzzles' },
  { href: '/results', label: 'Season Standings', desc: 'Live driver and constructor standings' },
  { href: '/blog', label: 'Read the Blog', desc: 'F1 analysis, history and telemetry explainers' },
]

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-[70vh] flex items-center">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-4">
            Error 404
          </p>
          <h1 className="text-4xl md:text-5xl text-white mb-4 font-display">
            Off the racing line
          </h1>
          <p className="text-white/65 mb-10">
            This page doesn&apos;t exist — it may have been moved or retired.
            Here&apos;s the way back to the good stuff.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {DESTINATIONS.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 hover:border-[#d4a017]/40 hover:bg-[#0d0d0d] transition-all"
              >
                <p className="text-white text-sm font-medium group-hover:text-[#d4a017] transition-colors">
                  {d.label}
                </p>
                <p className="text-white/65 text-xs mt-1">{d.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
