import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { ExploreRail } from '@/components/layout/ExploreRail'

const GA_MEASUREMENT_ID = 'G-HVKDBEVYBD'
const SITE_URL = 'https://f1racesignature.site'

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
  authors: [{ name: 'F1RaceSignature', url: SITE_URL }],
  creator: 'F1RaceSignature',
  publisher: 'F1RaceSignature',
  category: 'Art & Design',
  keywords: [
    'F1 art',
    'Formula 1 poster',
    'F1 telemetry art',
    'racing line art',
    'F1 wall art',
    'race data visualization',
    'Formula 1 print',
    'Senna Monaco poster',
    'Hamilton Silverstone art',
    'Verstappen Abu Dhabi poster',
    'Schumacher lap art',
    'motorsport poster',
    'circuit map art',
    'F1 collectible prints',
    'F1 speed heatmap',
    'F1 sector split',
    'Formula 1 fan art',
    'F1 gift idea',
    'Grand Prix poster',
    'F1 data art',
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
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'F1RaceSignature — Formula 1 telemetry as collectible poster art',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1RaceSignature — Where Speed Becomes Art',
    description: 'F1 telemetry as a museum exhibit. Legendary drives — Senna, Hamilton, Verstappen — rendered as collectible art.',
    images: [`${SITE_URL}/opengraph-image`],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  verification: {
    google: [
      '3f3qJMCfNOHhuenfPZcNEthUo7efQmOrIPp4Y-5SmNQ',
      '3YLBw-7OT0A8qI0f_LeVIcRWTIbvz13_tIUV2BCZuaQ',
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#030303',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
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
                email: 'wayfarerwondersblog@gmail.com',
                logo: {
                  '@type': 'ImageObject',
                  url: `${SITE_URL}/opengraph-image`,
                  width: 1200,
                  height: 630,
                },
                contactPoint: {
                  '@type': 'ContactPoint',
                  email: 'wayfarerwondersblog@gmail.com',
                  contactType: 'customer support',
                },
              },
            ],
          })}
        </Script>

        {/* Google Consent Mode v2 — deny by default until user accepts */}
        <Script id="google-consent-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500,
            });
          `}
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
        <ExploreRail />
        <CookieBanner />
      </body>
    </html>
  )
}
