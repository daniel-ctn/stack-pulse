import type { MetadataRoute } from 'next'

import { getPublicStackSlugs } from '@/lib/public-stacks'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const now = new Date()
  const stacks = await getPublicStackSlugs()

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/stacks`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...stacks.map((stack) => ({
      url: `${base}/stacks/${stack.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ]
}
