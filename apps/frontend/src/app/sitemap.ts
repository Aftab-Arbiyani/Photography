import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config';

const staticRoutes = ['', '/gallery', '/collections', '/albums', '/about', '/contact', '/faq'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
