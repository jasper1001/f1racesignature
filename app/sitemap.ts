import type { MetadataRoute } from 'next'

const SITE_URL = 'https://f1racesignature.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/studio`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}
