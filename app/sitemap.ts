import type { MetadataRoute } from 'next'
import { getAllDrivers, getAllRaces } from '@/lib/serverData'
import { getAllArticleSlugs } from '@/lib/articles'

const SITE_URL = 'https://f1racesignature.site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/studio`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/drivers`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/results`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/schedule`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/calendar`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/games`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/games/lights-out`,             lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/games/guess-the-driver`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/games/track-outline`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/games/championship-decider`,   lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/games/predict-driver`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/games/higher-lower`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/games/team-radio`,             lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/games/pit-stop-timer`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
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

  const blogIndex: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const blogPages: MetadataRoute.Sitemap = getAllArticleSlugs().map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  return [...core, ...blogIndex, ...blogPages, ...driverPages, ...racePages]
}
