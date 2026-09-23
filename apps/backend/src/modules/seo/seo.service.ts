import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentStatus, type SitemapEntry } from '@photography/types';
import type { AppConfig } from '../../config/configuration';
import { RedisService } from '../../redis/redis.service';
import { Album } from '../albums/entities/album.entity';
import { Collection } from '../collections/entities/collection.entity';
import { Photo } from '../photos/entities/photo.entity';

const CACHE_KEY = 'seo:sitemap';
const CACHE_TTL = 3600; // regenerated hourly (or on demand)
const RSS_CACHE_KEY = 'seo:rss';
const RSS_CACHE_TTL = 900; // 15 minutes

/** Minimal XML entity escaping for RSS text nodes. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Produces sitemap URL entries from published content so the frontend's
 * sitemap.xml updates automatically as content changes (no manual edits).
 */
@Injectable()
export class SeoService {
  private readonly siteUrl: string;

  constructor(
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(Collection) private readonly collectionRepository: Repository<Collection>,
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.siteUrl = configService.getOrThrow<AppConfig>('app').frontendUrl;
  }

  async getSitemap(): Promise<SitemapEntry[]> {
    const cached = await this.redis.get<SitemapEntry[]>(CACHE_KEY);
    if (cached) return cached;
    const entries = await this.build();
    await this.redis.set(CACHE_KEY, entries, CACHE_TTL);
    return entries;
  }

  /** Invalidate the cached sitemap + RSS (called by cron / on publish). */
  async invalidate(): Promise<void> {
    await Promise.all([this.redis.del(CACHE_KEY), this.redis.del(RSS_CACHE_KEY)]);
  }

  /** RSS 2.0 feed of the most recent published photos, cached in Redis. */
  async getRssFeed(): Promise<string> {
    const cached = await this.redis.get<string>(RSS_CACHE_KEY);
    if (cached) return cached;
    const xml = await this.buildRss();
    await this.redis.set(RSS_CACHE_KEY, xml, RSS_CACHE_TTL);
    return xml;
  }

  private async buildRss(): Promise<string> {
    const photos = await this.photoRepository.find({
      where: { status: ContentStatus.PUBLISHED },
      select: { slug: true, title: true, description: true, publishedAt: true, updatedAt: true },
      order: { publishedAt: 'DESC' },
      take: 50,
    });

    const items = photos
      .map((p) => {
        const link = `${this.siteUrl}/photos/${p.slug}`;
        const date = (p.publishedAt ?? p.updatedAt).toUTCString();
        return [
          '    <item>',
          `      <title>${xmlEscape(p.title)}</title>`,
          `      <link>${xmlEscape(link)}</link>`,
          `      <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
          `      <pubDate>${date}</pubDate>`,
          p.description ? `      <description>${xmlEscape(p.description)}</description>` : '',
          '    </item>',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '  <channel>',
      `    <title>Aperture — Latest Photography</title>`,
      `    <link>${xmlEscape(this.siteUrl)}</link>`,
      `    <description>The newest published photographs on Aperture.</description>`,
      `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      items,
      '  </channel>',
      '</rss>',
    ].join('\n');
  }

  private async build(): Promise<SitemapEntry[]> {
    const url = (path: string) => `${this.siteUrl}${path}`;
    const staticEntries: SitemapEntry[] = [
      { loc: url('/'), lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1 },
      {
        loc: url('/gallery'),
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        loc: url('/collections'),
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      },
      {
        loc: url('/albums'),
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      },
    ];

    const [photos, albums, collections] = await Promise.all([
      this.photoRepository.find({
        where: { status: ContentStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
        order: { publishedAt: 'DESC' },
        take: 50_000,
      }),
      this.albumRepository.find({
        where: { status: ContentStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
      }),
      this.collectionRepository.find({
        where: { status: ContentStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticEntries,
      ...photos.map(
        (p): SitemapEntry => ({
          loc: url(`/photos/${p.slug}`),
          lastmod: p.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: 0.6,
        }),
      ),
      ...albums.map(
        (a): SitemapEntry => ({
          loc: url(`/albums/${a.slug}`),
          lastmod: a.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: 0.6,
        }),
      ),
      ...collections.map(
        (c): SitemapEntry => ({
          loc: url(`/collections/${c.slug}`),
          lastmod: c.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: 0.5,
        }),
      ),
    ];
  }
}
