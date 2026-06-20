import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'

export const metadata: Metadata = {
  title: 'F1 Hall of Fame — Legendary Drives as Poster Art',
  description:
    'A curated gallery of 12 iconic Formula 1 drives turned into museum-quality poster art — Senna at Monaco 1984, Schumacher at Spa 1992, Verstappen at Abu Dhabi 2021, and more.',
  keywords: [
    'F1 poster art', 'Formula 1 legendary drives', 'F1 race art', 'Senna Monaco poster',
    'Schumacher Spa poster', 'Verstappen poster art', 'F1 collectible poster', 'F1 hall of fame',
    'Formula 1 art print', 'iconic F1 moments', 'F1 race signature poster',
  ],
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'F1 Hall of Fame — Legendary Drives as Poster Art',
    description: 'Twelve iconic Formula 1 drives turned into museum-quality poster art. Senna, Schumacher, Hamilton, Verstappen and more.',
    url: '/gallery',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Hall of Fame — F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Hall of Fame — Legendary Drives as Poster Art',
    description: 'Twelve iconic F1 drives turned into collectible poster art. Browse the gallery.',
    images: ['/opengraph-image'],
  },
}

export default function GalleryPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Hero */}
        <div className="relative py-20 border-b border-[#0f0f0f] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,160,23,0.05) 0%, transparent 70%)',
            }}
          />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-4">
              The Collection
            </p>
            <h1
              className="text-4xl md:text-6xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Hall of Fame
            </h1>
            <p className="text-white/65 text-lg max-w-xl mx-auto">
              Twelve legendary drives. Twelve museum-quality posters.
              Each one a chapter in F1 history.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <GalleryGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}
