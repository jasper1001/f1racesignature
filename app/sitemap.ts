import type { MetadataRoute } from 'next'
import { getAllDrivers, getAllRaces } from '@/lib/serverData'
import { getAllArticleSlugs } from '@/lib/articles'
import { GAMES } from '@/lib/games/registry'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/studio`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/drivers`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/results`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/predictions`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/schedule`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/calendar`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/games`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Every game in the registry — the registry is the single source of truth,
  // so new games are picked up here automatically.
  const gamePages: MetadataRoute.Sitemap = GAMES.map((g) => ({
    url: `${SITE_URL}${g.href}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

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

  const blogIndex: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const blogPages: MetadataRoute.Sitemap = getAllArticleSlugs().map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  return [...core, ...gamePages, ...blogIndex, ...blogPages, ...driverPages, ...racePages]
}
