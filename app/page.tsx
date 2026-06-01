import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FeaturedGallery } from '@/components/landing/FeaturedGallery'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="pt-14">
        <Hero />
        <HowItWorks />
        <FeaturedGallery />

        {/* CTA section */}
        <section className="py-24 border-t border-[#0f0f0f] text-center">
          <div className="max-w-2xl mx-auto px-6">
            <p
              className="text-4xl md:text-5xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Ready to create
              <br />
              <span className="text-[#d4a017]">your poster?</span>
            </p>
            <p className="text-[#555555] mb-8">
              Free to start. No account required. Just pick a driver and create.
            </p>
            <a
              href="/studio"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100"
            >
              Open the Studio
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
