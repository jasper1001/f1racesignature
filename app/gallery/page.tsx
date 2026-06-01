import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'

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
            <p className="text-[#555555] text-lg max-w-xl mx-auto">
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
