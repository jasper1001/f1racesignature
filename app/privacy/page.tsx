import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How F1RaceSignature collects, uses, and protects your information.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy | F1RaceSignature',
    description: 'How F1RaceSignature collects, uses, and protects your information.',
    url: '/privacy',
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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-white/65 text-sm">Last updated: June 2026</p>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">

          <Section title="1. Introduction">
            <p>
              F1RaceSignature (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website{' '}
              <strong className="text-[#aaaaaa]">f1racesignature.site</strong> (the &quot;Service&quot;). This
              Privacy Policy explains what information we collect, how we use it, and your rights in
              relation to it.
            </p>
            <p>
              By using the Service you agree to the collection and use of information in accordance
              with this policy.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>
              <strong className="text-[#aaaaaa]">Usage data (automatically collected):</strong> When you
              visit the Service, our analytics provider automatically records certain information your
              browser sends, including your IP address (anonymised), browser type and version, the
              pages you visit, the time and date of your visit, and referring URLs.
            </p>
            <p>
              <strong className="text-[#aaaaaa]">Locally stored data:</strong> Poster configurations you
              save to &quot;My Garage&quot; and your studio onboarding state are stored exclusively in your
              browser&apos;s local storage. This data never leaves your device and is not transmitted to
              us or any third party.
            </p>
            <p>
              <strong className="text-[#aaaaaa]">No account data:</strong> F1RaceSignature does not
              require registration. We do not collect names, email addresses, or any other personally
              identifying information unless you contact us directly.
            </p>
          </Section>

          <Section title="3. How We Use Information">
            <p>We use the data collected for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>To understand how visitors use the Service and improve the experience.</li>
              <li>To monitor the performance and stability of the website.</li>
              <li>To detect and address technical issues.</li>
              <li>To measure the reach and effectiveness of the content we publish.</li>
            </ul>
            <p>We do not sell, rent, or share your personal information with third parties for their marketing purposes.</p>
          </Section>

          <Section title="4. Third-Party Services">
            <p>We use the following third-party services that may process data on our behalf:</p>

            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-2">
              <p className="text-white text-sm font-medium">Google Analytics (GA4)</p>
              <p className="text-sm">
                We use Google Analytics to collect aggregated, anonymised usage statistics. Google may
                process data on servers in the United States and other countries. IP anonymisation is
                enabled. See{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  Google&apos;s Privacy Policy
                </a>{' '}
                for details.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-2">
              <p className="text-white text-sm font-medium">Vercel</p>
              <p className="text-sm">
                The Service is hosted on Vercel&apos;s infrastructure. Vercel may log request metadata
                (IP address, timestamps) for security and performance purposes. See{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  Vercel&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-2">
              <p className="text-white text-sm font-medium">Jolpica F1 API</p>
              <p className="text-sm">
                Live driver standings and season data is fetched from the{' '}
                <a
                  href="https://jolpi.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  Jolpica F1 API
                </a>
                , a community-maintained open data source. No personal data is sent to this service —
                requests contain only public query parameters such as driver ID and season year.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-2">
              <p className="text-white text-sm font-medium">Social Sharing (Facebook & X/Twitter)</p>
              <p className="text-sm">
                Game result pages include share buttons for Facebook and X (Twitter). Clicking a share
                button opens the respective platform in a new window. We do not transmit any personal
                data to Facebook or X — the share dialog is opened entirely on their domain. Those
                platforms may set their own cookies and collect data according to their policies. See{' '}
                <a
                  href="https://www.facebook.com/privacy/policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  Facebook&apos;s Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="https://x.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  X&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-2">
              <p className="text-white text-sm font-medium">Google AdSense (planned)</p>
              <p className="text-sm">
                We may in the future display advertisements served by Google AdSense. Google AdSense
                uses cookies to serve ads based on your prior visits to this or other websites. You
                can opt out of personalised advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a017] hover:underline"
                >
                  Google Ads Settings
                </a>
                .
              </p>
            </div>
          </Section>

          <Section title="5. Cookies">
            <p>
              We use cookies and browser local storage as described in our{' '}
              <Link href="/cookies" className="text-[#d4a017] hover:underline">
                Cookie Policy
              </Link>
              . In summary: we use Google Analytics cookies for usage measurement and local storage
              for saving your poster configurations. We do not use advertising or tracking cookies
              from any ad network at this time.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              Google Analytics data is retained for 14 months and then automatically deleted. Locally
              stored data (garage, onboarding state) remains on your device until you clear it via
              your browser settings.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-[#aaaaaa]">Access:</strong> the right to request a copy of data we hold about you.</li>
              <li><strong className="text-[#aaaaaa]">Erasure:</strong> the right to request deletion of your data.</li>
              <li><strong className="text-[#aaaaaa]">Objection:</strong> the right to object to processing of your data.</li>
              <li><strong className="text-[#aaaaaa]">Portability:</strong> the right to receive your data in a portable format.</li>
            </ul>
            <p>
              Because we collect only anonymised analytics data and store no account information,
              most of these rights apply to Google Analytics data. You can exercise your rights with
              Google directly, or contact us and we will assist where possible.
            </p>
            <p>
              <strong className="text-[#aaaaaa]">California residents (CCPA):</strong> We do not sell
              personal information. You have the right to know what data is collected and to request
              deletion.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              The Service is not directed at children under the age of 13. We do not knowingly collect
              personal information from children. If you believe a child has provided us with personal
              information, please contact us and we will delete it.
            </p>
          </Section>

          <Section title="9. Links to Other Sites">
            <p>
              The Service may contain links to third-party websites (e.g. Ko-fi, GitHub). We are not
              responsible for the privacy practices of those sites and encourage you to review their
              policies before providing any personal information.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. The &quot;last updated&quot; date at the top
              of this page reflects the most recent revision. We encourage you to review this page
              periodically. Continued use of the Service after changes are posted constitutes your
              acceptance of the revised policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your data rights,
              please contact us at{' '}
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
