import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const GA_MEASUREMENT_ID = 'G-HVKDBEVYBD'

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

export const metadata: Metadata = {
  title: 'F1RaceSignature — Where Speed Becomes Art',
  description:
    'Transform legendary F1 lap data into collectible poster art. Racing lines, speed traces, and sector data rendered as cinematic prints you\'d hang in a museum.',
  keywords: ['F1', 'Formula 1', 'racing', 'telemetry', 'poster', 'art', 'data visualization'],
  openGraph: {
    title: 'F1RaceSignature — Where Speed Becomes Art',
    description: 'F1 telemetry as a museum exhibit. Legendary drives rendered as collectible art.',
    type: 'website',
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
