import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
