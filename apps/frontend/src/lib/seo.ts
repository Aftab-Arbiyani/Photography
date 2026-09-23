import type { Metadata } from 'next';
import { siteConfig } from './config';

interface SeoParams {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
}

/**
 * Builds Next.js Metadata with OpenGraph + Twitter cards from a single call.
 * Used by every page to keep SEO consistent.
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  image = '/og-default.jpg',
  type = 'website',
}: SeoParams = {}): Metadata {
  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — Photography, framed`;
  const url = new URL(path, siteConfig.url).toString();
  const ogImage = image.startsWith('http') ? image : new URL(image, siteConfig.url).toString();

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitter,
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

/** JSON-LD Organization schema for the homepage. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };
}
