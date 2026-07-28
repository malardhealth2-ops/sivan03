import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { getSiteUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    // Homepage section anchors (help Google associate deep links with content).
    {
      url: `${siteUrl}/#services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/#fleet`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/#routes`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/#contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const posts = await db.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    for (const post of posts) {
      entries.push({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // DB unavailable — still return the static entries above.
  }

  return entries;
}
