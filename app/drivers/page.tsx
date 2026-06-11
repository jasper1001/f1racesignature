import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getAllDrivers, getRacesForDriver } from '@/lib/serverData'

export const metadata: Metadata = {
  title: 'F1 Drivers — Create Poster Art From Legendary Laps',
  description:
    'Browse every driver in the F1RaceSignature collection — Senna, Hamilton, Schumacher, Verstappen, Leclerc, Norris and more. Turn their legendary laps into collectible poster art.',
  alternates: { canonical: '/drivers' },
  openGraph: {
    title: 'F1 Drivers — Create Poster Art From Legendary Laps',
    description: 'Every driver in the F1RaceSignature collection, from Senna to Leclerc.',
    url: '/drivers',
    type: 'website',
  },
}

export default function DriversIndexPage() {
  const drivers = getAllDrivers()

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-4">The Drivers</p>
          <h1 className="text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Legends of Formula 1
          </h1>
          <p className="text-[#555555] max-w-xl mx-auto">
            Twelve drivers, decades of greatness. Pick a name to explore their iconic laps and turn them into art.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {drivers.map((d) => {
            const count = getRacesForDriver(d.id).length
            return (
              <Link
                key={d.id}
                href={`/drivers/${d.id}`}
                className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 hover:border-[#333333] transition-colors"
                style={{ borderTopColor: d.color, borderTopWidth: 3 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: d.color + '22', border: `1px solid ${d.color}55` }}
                  >
                    {d.shortName}
                  </div>
                  <div>
                    <div className="text-white font-medium group-hover:text-[#d4a017] transition-colors">{d.name}</div>
                    <div className="text-[#555555] text-xs">{d.team}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="text-[#666666]">
                    {d.championships > 0 ? `${d.championships}× Champion` : 'Grand Prix winner'}
                  </span>
                  <span className="text-[#444444] font-mono">{count} {count === 1 ? 'drive' : 'drives'}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}
