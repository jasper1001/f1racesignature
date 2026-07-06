import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How F1RaceSignature uses cookies and local storage — including Google Analytics and how to opt out.',
  alternates: { canonical: '/cookies' },
  openGraph: {
    title: 'Cookie Policy | F1RaceSignature',
    description: 'How F1RaceSignature uses cookies and local storage.',
    url: '/cookies',
    type: 'website',
  },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-mono uppercase tracking-widest text-white/65 mb-4">{title}</h2>
      <div className="space-y-3 text-white/65 leading-relaxed">{children}</div>
    </section>
  )
}

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Hero */}
        <div className="border-b border-[#0f0f0f] py-16 px-6 text-center">
          <p className="text-white/65 text-xs font-mono uppercase tracking-widest mb-4">Legal</p>
          <h1
            className="text-4xl md:text-5xl text-white mb-4 font-display"
          >
            Cookie Policy
          </h1>
          <p className="text-white/65 text-sm">Last updated: June 2026</p>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">

          <Section title="1. What Are Cookies?">
            <p>
              Cookies are small text files placed on your device by a website. They are widely used to
              make websites work efficiently and to provide reporting information to site owners.
            </p>
            <p>
              F1RaceSignature also uses browser <strong className="text-[#aaaaaa]">local storage</strong> — a
              similar mechanism that stores data directly in your browser, without an expiry date, and
              without sending data to any server.
            </p>
          </Section>

          <Section title="2. Cookies We Use">
            <p>We use only the following cookies and storage mechanisms:</p>

            {/* Google Analytics */}
            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">Google Analytics (GA4)</p>
                  <p className="text-white/65 text-xs font-mono mt-0.5">Measurement ID: G-HVKDBEVYBD</p>
                </div>
                <span className="flex-shrink-0 text-[9px] font-mono uppercase tracking-wider border border-[#2a2a2a] rounded px-2 py-1 text-white/65">
                  Analytics
                </span>
              </div>
              <p className="text-sm">
                We use Google Analytics to understand how visitors use the site — which pages are most
                popular, how long sessions last, and where traffic comes from. This data is aggregated
                and anonymous; we cannot identify you personally from it.
              </p>
              <p className="text-sm">
                Google Analytics sets the following cookies:{' '}
                <code className="bg-[#111111] px-1.5 py-0.5 rounded text-[#aaaaaa] text-xs">_ga</code>,{' '}
                <code className="bg-[#111111] px-1.5 py-0.5 rounded text-[#aaaaaa] text-xs">_ga_*</code>.
                These persist for up to 2 years.
              </p>
              <p className="text-sm">
                Google&apos;s privacy policy:{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  policies.google.com/privacy
                </a>
              </p>
            </div>

            {/* Local Storage */}
            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">My Garage (local storage)</p>
                  <p className="text-white/65 text-xs font-mono mt-0.5">Key: f1rs_garage</p>
                </div>
                <span className="flex-shrink-0 text-[9px] font-mono uppercase tracking-wider border border-[#2a2a2a] rounded px-2 py-1 text-white/65">
                  Functional
                </span>
              </div>
              <p className="text-sm">
                When you save a poster to &quot;My Garage&quot;, the configuration (driver, race, theme, viz
                mode) is stored in your browser&apos;s local storage so it persists between visits. This
                data never leaves your device and is not sent to any server.
              </p>
            </div>

            {/* Onboarding */}
            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">Onboarding state (local storage)</p>
                  <p className="text-white/65 text-xs font-mono mt-0.5">Key: f1rs_seen</p>
                </div>
                <span className="flex-shrink-0 text-[9px] font-mono uppercase tracking-wider border border-[#2a2a2a] rounded px-2 py-1 text-white/65">
                  Functional
                </span>
              </div>
              <p className="text-sm">
                A single flag is stored to remember whether you have already seen the first-visit studio
                tour, so it does not appear again on subsequent visits. No personal data is stored.
              </p>
            </div>
          </Section>

          <Section title="3. What We Do Not Use">
            <p>F1RaceSignature does <strong className="text-[#aaaaaa]">not</strong> use:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Advertising or tracking cookies from third-party ad networks.</li>
              <li>Social media tracking pixels (Facebook Pixel, Twitter/X Pixel, etc.).</li>
              <li>Cookies that identify you personally.</li>
              <li>Session cookies that persist beyond your browser session (other than those set by Google Analytics).</li>
            </ul>
            <p>
              <strong className="text-[#aaaaaa]">Note on share buttons:</strong> Game pages include
              buttons to share your result on Facebook and X (Twitter). These buttons open those
              platforms in a new window using a standard sharer URL — no tracking pixel or cookie is
              set on our site. However, once you land on Facebook or X their own cookie and tracking
              policies apply.
            </p>
          </Section>

          <Section title="4. Managing & Opting Out">
            <p>
              <strong className="text-[#aaaaaa]">Browser settings:</strong> You can block or delete
              cookies at any time through your browser settings. Note that blocking analytics cookies
              will not affect the core functionality of F1RaceSignature.
            </p>
            <p>
              <strong className="text-[#aaaaaa]">Google Analytics opt-out:</strong> You can prevent
              Google Analytics from collecting data about your visits by installing the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d4a017] hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>
            <p>
              <strong className="text-[#aaaaaa]">Local storage:</strong> You can clear local storage
              via your browser&apos;s developer tools (Application → Local Storage → f1racesignature domain →
              Delete). This will clear your saved garage and onboarding state.
            </p>
          </Section>

          <Section title="5. Changes to This Policy">
            <p>
              We may update this Cookie Policy from time to time. The &quot;last updated&quot; date at the top
              of this page reflects the most recent revision. Continued use of the Service after changes
              are posted constitutes your acceptance of the revised policy.
            </p>
          </Section>

          <Section title="6. Contact">
            <p>
              Questions about this Cookie Policy? Contact us at{' '}
              <a href="mailto:wayfarerwondersblog@gmail.com" className="text-[#d4a017] hover:underline">
                wayfarerwondersblog@gmail.com
              </a>
              .
            </p>
          </Section>

        </div>
      </main>
      <Footer />
    </>
  )
}
