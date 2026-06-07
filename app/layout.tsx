import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const GA_MEASUREMENT_ID = 'G-HVKDBEVYBD'
const SITE_URL = 'https://f1racesignature.vercel.app'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
})

const DESCRIPTION =
  'Transform legendary F1 lap data into collectible poster art. Racing lines, speed traces, and sector data from iconic Formula 1 drives — Senna, Hamilton, Schumacher, Verstappen — rendered as cinematic prints you\'d hang in a museum.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'F1RaceSignature — Where Speed Becomes Art',
    template: '%s | F1RaceSignature',
  },
  description: DESCRIPTION,
  applicationName: 'F1RaceSignature',
  authors: [{ name: 'F1RaceSignature' }],
  creator: 'F1RaceSignature',
  publisher: 'F1RaceSignature',
  category: 'Art & Design',
  keywords: [
    'F1 art',
    'Formula 1 poster',
    'F1 telemetry',
    'racing line art',
    'F1 wall art',
    'race data visualization',
    'Senna Monaco',
    'Hamilton Silverstone',
    'Verstappen Abu Dhabi',
    'motorsport poster',
    'circuit map art',
    'F1 collectible prints',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'F1RaceSignature',
    title: 'F1RaceSignature — Where Speed Becomes Art',
    description: DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1RaceSignature — Where Speed Becomes Art',
    description: 'F1 telemetry as a museum exhibit. Legendary drives rendered as collectible art.',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  verification: {
    google: '3f3qJMCfNOHhuenfPZcNEthUo7efQmOrIPp4Y-5SmNQ',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Structured data — WebSite + Organization */}
        <Script id="ld-json" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: 'F1RaceSignature',
                description: DESCRIPTION,
                publisher: { '@id': `${SITE_URL}/#org` },
              },
              {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#org`,
                name: 'F1RaceSignature',
                url: SITE_URL,
                slogan: 'Where speed becomes art',
              },
            ],
          })}
        </Script>

        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
