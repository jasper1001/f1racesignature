'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getGarage, removeFromGarage, type SavedPoster } from '@/lib/garage'

export default function GaragePage() {
  const [items, setItems] = useState<SavedPoster[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const refresh = () => setItems(getGarage())
    refresh()
    setReady(true)
    window.addEventListener('garage-changed', refresh)
    return () => window.removeEventListener('garage-changed', refresh)
  }, [])

  const studioUrl = (p: SavedPoster) =>
    `/studio?driver=${p.driverId}&race=${p.raceId}&theme=${p.theme}&viz=${p.vizMode}`

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-4">Your Collection</p>
          <h1 className="text-4xl md:text-5xl text-white mb-3" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            My Garage
          </h1>
          <p className="text-white/65 max-w-md mx-auto">
            Posters you&apos;ve saved, stored on this device. Open one to keep editing or export it.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-20">
          {ready && items.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-[#161616] bg-[#0a0a0a]">
              <p className="text-white/65 text-sm mb-4">Your garage is empty.</p>
              <Link href="/studio" className="inline-flex px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-colors">
                Create your first poster
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((p) => (
                <div key={p.id} className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 hover:border-[#333333] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={studioUrl(p)} className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm group-hover:text-[#d4a017] transition-colors truncate">{p.driverName}</div>
                      <div className="text-white/65 text-xs mt-0.5 truncate">{p.raceName}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#d4a017]/12 text-[#d4a017]">
                          {p.theme.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-white/65">{p.vizMode.replace(/_/g, ' ')}</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeFromGarage(p.id)}
                      title="Remove"
                      className="text-[#aaaaaa] hover:text-[#e8002d] transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <Link
                    href={studioUrl(p)}
                    className="mt-3 block text-center text-xs font-medium py-2 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/8 transition-colors"
                  >
                    Open in Studio
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
