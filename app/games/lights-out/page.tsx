import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LightsOutGame } from '@/components/games/LightsOutGame'

export const metadata: Metadata = {
  title: 'Lights Out — Reaction Test',
  description:
    'Test your F1 reflexes. Watch the starting lights illuminate one by one — then react the instant they go out. How fast are you?',
  alternates: { canonical: '/games/lights-out' },
  openGraph: {
    title: 'Lights Out — Reaction Test | F1RaceSignature',
    description: 'Test your F1 reflexes. React the moment the lights go out.',
    url: '/games/lights-out',
    type: 'website',
  },
}

export default function LightsOutPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Breadcrumb */}
        <div className="border-b border-[#0a0a0a] py-4 px-6">
          <div className="max-w-lg mx-auto">
            <Link
              href="/games"
              className="inline-flex items-center gap-1.5 text-[#444444] text-xs font-mono uppercase tracking-widest hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 6H3M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mini Games
            </Link>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[#444444] text-xs font-mono uppercase tracking-widest mb-3">
              Reaction Test
            </p>
            <h1
              className="text-4xl md:text-5xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Lights Out
            </h1>
            <p className="text-[#555555] text-sm max-w-sm mx-auto leading-relaxed">
              Five lights illuminate one by one. React the instant they all go dark.
              Jump the start and you&apos;ll have to go again.
            </p>
          </div>

          {/* Ratings reference */}
          <div className="grid grid-cols-2 gap-2 mb-8">
            {[
              { label: 'Under 180ms', rating: 'Elite Reflexes', color: '#d4a017' },
              { label: '180 – 250ms', rating: 'F1 Driver Level', color: '#c0c0c0' },
              { label: '251 – 350ms', rating: 'Great Reaction', color: '#cd7f32' },
              { label: 'Above 350ms', rating: 'Keep Practicing', color: '#444444' },
            ].map((r) => (
              <div
                key={r.rating}
                className="rounded-xl border border-[#111111] bg-[#060606] px-3 py-2.5"
              >
                <p className="text-[10px] font-mono text-[#333333] uppercase tracking-wider">{r.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: r.color }}>{r.rating}</p>
              </div>
            ))}
          </div>

          <LightsOutGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
