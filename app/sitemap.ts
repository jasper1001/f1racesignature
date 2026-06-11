import type { MetadataRoute } from 'next'
import { getAllDrivers, getAllRaces } from '@/lib/serverData'

const SITE_URL = 'https://f1racesignature.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/studio`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/drivers`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/results`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ]

  const driverPages: MetadataRoute.Sitemap = getAllDrivers().map((d) => ({
    url: `${SITE_URL}/drivers/${d.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const racePages: MetadataRoute.Sitemap = getAllRaces().map((r) => ({
    url: `${SITE_URL}/race/${r.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...core, ...driverPages, ...racePages]
}
