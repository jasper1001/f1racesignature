import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Studio — Design Your F1 Poster',
  description:
    'Build a custom F1 telemetry poster. Pick a legendary driver and race, choose a visualization — racing line, speed heatmap, sector split — and an artistic theme, then export.',
  alternates: { canonical: '/studio' },
  openGraph: {
    title: 'Studio — Design Your F1 Poster',
    description:
      'Build a custom F1 telemetry poster from real lap data and export museum-quality art.',
    url: '/studio',
    type: 'website',
  },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
