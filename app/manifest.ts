import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'F1RaceSignature — Where Speed Becomes Art',
    short_name: 'F1RaceSignature',
    description:
      'Transform legendary F1 lap telemetry into collectible poster art. Racing lines, speed traces, and sector data rendered as cinematic prints.',
    start_url: '/',
    display: 'standalone',
    background_color: '#030303',
    theme_color: '#030303',
    categories: ['art', 'design', 'sports', 'entertainment'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
