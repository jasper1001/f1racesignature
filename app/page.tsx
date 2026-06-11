import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FeaturedGallery } from '@/components/landing/FeaturedGallery'
import { FAQ } from '@/components/landing/FAQ'
import { FAQ_ITEMS } from '@/lib/faq'

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

export default function HomePage() {
  return (
    <>
      {/* FAQ structured data for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main className="pt-14">
        <Hero />
        <HowItWorks />
        <FeaturedGallery />

        {/* SEO content — crawlable description of the product */}
        <section className="py-20 border-t border-[#0f0f0f]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2
              className="text-3xl md:text-4xl text-white mb-6"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Formula 1 telemetry, reimagined as art
            </h2>
            <p className="text-[#777777] leading-relaxed mb-4">
              F1RaceSignature transforms real Formula 1 lap data into collectible poster art. Every
              print is built from genuine GPS car-position telemetry — the exact racing line a driver
              carved through Eau Rouge, the Casino chicane, or Copse — mapped onto an accurate circuit
              outline and rendered in a cinematic, gallery-ready style.
            </p>
            <p className="text-[#777777] leading-relaxed">
              Choose from legendary drives by Ayrton Senna, Lewis Hamilton, Michael Schumacher, Max
              Verstappen, Charles Leclerc, Lando Norris and more. Visualize the lap as a racing line, a
              blue-to-red speed heatmap, a three-sector split, or an overtake map — then apply one of
              eight artistic themes and export a high-resolution poster, free.
            </p>
            <p className="text-[#555555] text-sm leading-relaxed mt-6">
              Browse the full <a href="/drivers" className="text-[#d4a017] hover:underline">driver collection</a>,
              explore the <a href="/gallery" className="text-[#d4a017] hover:underline">poster gallery</a>, or
              follow the <a href="/results" className="text-[#d4a017] hover:underline">live 2026 F1 season standings</a>.
            </p>
          </div>
        </section>

        <FAQ />

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
