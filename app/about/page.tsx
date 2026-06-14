import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'About & Contact',
  description:
    'Learn about F1RaceSignature — the tool that transforms real Formula 1 telemetry into collectible poster art. Get in touch with our team.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About & Contact | F1RaceSignature',
    description: 'Learn about F1RaceSignature and get in touch.',
    url: '/about',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Hero */}
        <div className="border-b border-[#0f0f0f] py-16 px-6 text-center">
          <p className="text-white/50 text-xs font-mono uppercase tracking-widest mb-4">About</p>
          <h1
            className="text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Where speed becomes art
          </h1>
          <p className="text-white/65 text-sm max-w-xl mx-auto">
            F1RaceSignature turns real Formula 1 lap telemetry into gallery-quality posters — free, in your browser, in seconds.
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

          {/* What is it */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/45 mb-5">The Project</h2>
            <div className="space-y-4 text-white/65 leading-relaxed">
              <p>
                F1RaceSignature is a browser-based creative tool that takes genuine GPS car-position
                telemetry from iconic Formula 1 races and renders it as cinematic, museum-quality
                poster art. Every line you see on a poster is the exact path a driver carved through
                a circuit — not an illustration, not an approximation.
              </p>
              <p>
                Pick a driver, pick a race, choose a visualization style (racing line, speed heatmap,
                sector split, or overtake map), apply one of eight artistic themes, and export a
                high-resolution PNG — completely free, with no account required.
              </p>
              <p>
                The project was built as a love letter to the sport: a way to make the invisible
                (the physics, the braking points, the speed delta through a corner) visible and beautiful.
              </p>
            </div>
          </section>

          {/* Games */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/45 mb-5">F1 Games</h2>
            <div className="space-y-4 text-white/65 leading-relaxed">
              <p>
                Alongside the poster studio, F1RaceSignature includes a free collection of Formula 1
                mini-games — all playable in your browser with no account required.
              </p>
              <ul className="space-y-1.5 list-disc list-inside pl-2">
                <li><strong className="text-white">Lights Out</strong> — test your reaction time against the F1 starting lights.</li>
                <li><strong className="text-white">Guess the Driver</strong> — identify a driver from progressively revealed clues.</li>
                <li><strong className="text-white">Track Outline Quiz</strong> — name the circuit from its silhouette alone.</li>
                <li><strong className="text-white">Championship Decider</strong> — make pit-wall strategy calls from real race moments.</li>
                <li><strong className="text-white">Team Radio Guess</strong> — match iconic radio transmissions to their drivers.</li>
                <li><strong className="text-white">Predict the Driver</strong> — Wordle-style driver identification in six guesses.</li>
                <li><strong className="text-white">Higher or Lower</strong> — compare career statistics between F1 drivers.</li>
              </ul>
              <p>
                Each game includes share buttons so you can post your result to X (Twitter) or Facebook.
              </p>
            </div>
          </section>

          {/* Data sources */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/45 mb-5">Data Sources</h2>
            <div className="space-y-4 text-white/65 leading-relaxed">
              <p>
                Telemetry data is sourced via{' '}
                <a
                  href="https://theoehrly.github.io/Fast-F1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  FastF1
                </a>
                , an open-source Python library that provides access to Formula 1 timing, car telemetry,
                and position data published by the official F1 live-timing feed.
              </p>
              <p>
                Live driver standings and season results are fetched from the{' '}
                <a
                  href="https://jolpi.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  Jolpica F1 API
                </a>
                , a community-maintained open data source for Formula 1 statistics. All data is used
                strictly for artistic and educational purposes.
              </p>
              <p className="text-white/50 text-sm">
                F1RaceSignature is an independent fan project and is not affiliated with, endorsed by,
                or connected to Formula 1, Formula One Management, the FIA, or any F1 team.
              </p>
            </div>
          </section>

          {/* Creator */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/45 mb-5">The Creator</h2>
            <div className="space-y-4 text-white/65 leading-relaxed">
              <p>
                F1RaceSignature was designed and built by{' '}
                <a
                  href="https://jascodingvibe.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  JasCodingVibe
                </a>
                . If you enjoy the project, you can support its continued development on Ko-fi.
              </p>
              <div>
                <a
                  href="https://ko-fi.com/jascodingvibes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4a017] text-black text-sm font-semibold hover:bg-[#e8b84b] transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5h13a3 3 0 0 1 0 6h-1M4 5v8a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 2v1.5M10 2v1.5M13 2v1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Support on Ko-fi
                </a>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section id="contact">
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/45 mb-5">Contact</h2>
            <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-8 space-y-4">
              <p className="text-white/65 leading-relaxed">
                Have a question, a bug report, a feature idea, or a licensing enquiry? Send us an email
                and we'll get back to you as soon as possible.
              </p>
              <a
                href="mailto:wayfarerwondersblog@gmail.com"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-[#2a2a2a] text-white hover:border-[#d4a017]/50 hover:text-[#d4a017] transition-all text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M1.5 5.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                wayfarerwondersblog@gmail.com
              </a>
              <p className="text-white/45 text-xs">
                We aim to respond within 2–3 business days.
              </p>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
