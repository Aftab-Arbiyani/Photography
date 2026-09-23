import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContentStatus,
  type GlobalSearchResult,
  type Paginated,
  type SearchFacets,
  SearchEntityType,
  type SearchHit,
} from '@photography/types';
import { normalizePagination, paginate } from '@photography/utils';
import { RedisService } from '../../redis/redis.service';
import { StorageService } from '../../storage/storage.service';
import { Album } from '../albums/entities/album.entity';
import { Category } from '../categories/entities/category.entity';
import { Collection } from '../collections/entities/collection.entity';
import { Photo } from '../photos/entities/photo.entity';
import { Tag } from '../tags/entities/tag.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import type { PhotoSearchDto } from './dto/search.dto';

const GROUP_LIMIT = 8;
const CACHE_TTL = 60;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(Collection) private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
    private readonly analytics: AnalyticsService,
  ) {}

  private photoThumb(photo: Photo): string {
    return this.storage.getPublicUrl(photo.thumbnailKey ?? photo.storageKey);
  }

  /** Cross-entity search grouped by type. Redis-cached; records the query. */
  async global(query: string, viewerId?: string): Promise<GlobalSearchResult> {
    const term = query.trim();
    const empty: GlobalSearchResult = {
      query: term,
      total: 0,
      groups: {
        [SearchEntityType.PHOTO]: [],
        [SearchEntityType.ALBUM]: [],
        [SearchEntityType.COLLECTION]: [],
        [SearchEntityType.CATEGORY]: [],
        [SearchEntityType.TAG]: [],
      },
    };
    if (term.length < 2) return empty;

    const cacheKey = `search:global:${term.toLowerCase()}`;
    const cached = await this.redis.get<GlobalSearchResult>(cacheKey);
    if (cached) {
      void this.analytics.recordSearch(term, undefined, viewerId);
      return cached;
    }

    const like = `%${term}%`;
    const [photos, albums, collections, categories, tags] = await Promise.all([
      this.photoRepository
        .createQueryBuilder('p')
        .where('p.status = :s', { s: ContentStatus.PUBLISHED })
        .andWhere(`p.search_vector @@ websearch_to_tsquery('english', :q)`, { q: term })
        .orderBy(`ts_rank(p.search_vector, websearch_to_tsquery('english', :q))`, 'DESC')
        .addOrderBy('p.views_count', 'DESC')
        .take(GROUP_LIMIT)
        .getMany(),
      this.albumRepository.find({
        where: { status: ContentStatus.PUBLISHED },
        order: { salesCount: 'DESC' },
        take: 50,
      }),
      this.collectionRepository.find({ where: { status: ContentStatus.PUBLISHED }, take: 50 }),
      this.categoryRepository.find({ take: 100 }),
      this.tagRepository
        .createQueryBuilder('t')
        .where('t.name ILIKE :like', { like })
        .orderBy('t.usage_count', 'DESC')
        .take(GROUP_LIMIT)
        .getMany(),
    ]);

    const ci = (s: string) => s.toLowerCase().includes(term.toLowerCase());
    const groups = {
      [SearchEntityType.PHOTO]: photos.map(
        (p): SearchHit => ({
          type: SearchEntityType.PHOTO,
          id: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.locationName,
          imageId: p.id,
          imageUrl: this.photoThumb(p),
        }),
      ),
      [SearchEntityType.ALBUM]: albums
        .filter((a) => ci(a.title) || (a.description ? ci(a.description) : false))
        .slice(0, GROUP_LIMIT)
        .map(
          (a): SearchHit => ({
            type: SearchEntityType.ALBUM,
            id: a.id,
            slug: a.slug,
            title: a.title,
            subtitle: null,
            imageId: a.coverPhotoId,
          }),
        ),
      [SearchEntityType.COLLECTION]: collections
        .filter((c) => ci(c.title))
        .slice(0, GROUP_LIMIT)
        .map(
          (c): SearchHit => ({
            type: SearchEntityType.COLLECTION,
            id: c.id,
            slug: c.slug,
            title: c.title,
            subtitle: null,
            imageId: c.coverPhotoId,
          }),
        ),
      [SearchEntityType.CATEGORY]: categories
        .filter((c) => ci(c.name))
        .slice(0, GROUP_LIMIT)
        .map(
          (c): SearchHit => ({
            type: SearchEntityType.CATEGORY,
            id: c.id,
            slug: c.slug,
            title: c.name,
            subtitle: null,
            imageId: c.coverPhotoId,
          }),
        ),
      [SearchEntityType.TAG]: tags.map(
        (t): SearchHit => ({
          type: SearchEntityType.TAG,
          id: t.id,
          slug: t.slug,
          title: t.name,
          subtitle: `${t.usageCount} photos`,
          imageId: null,
        }),
      ),
    };

    const result: GlobalSearchResult = {
      query: term,
      total: Object.values(groups).reduce((sum, g) => sum + g.length, 0),
      groups,
    };

    await this.redis.set(cacheKey, result, CACHE_TTL);
    void this.analytics.recordSearch(term, undefined, viewerId);
    return result;
  }

  /** Faceted photo search (camera / lens / location / tag / category + free text). */
  async photos(dto: PhotoSearchDto, viewerId?: string): Promise<Paginated<SearchHit>> {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);
    const qb = this.photoRepository
      .createQueryBuilder('p')
      .where('p.status = :s', { s: ContentStatus.PUBLISHED });

    // Full-text relevance match on the generated tsvector (websearch syntax is
    // safe for raw user input — quotes/operators handled by Postgres).
    if (dto.q) {
      qb.andWhere(`p.search_vector @@ websearch_to_tsquery('english', :q)`, { q: dto.q });
    }
    if (dto.camera) {
      qb.andWhere('(p.camera_make ILIKE :cam OR p.camera_model ILIKE :cam)', {
        cam: `%${dto.camera}%`,
      });
    }
    if (dto.lens) qb.andWhere('p.lens_model ILIKE :lens', { lens: `%${dto.lens}%` });
    if (dto.location) qb.andWhere('p.location_name ILIKE :loc', { loc: `%${dto.location}%` });
    if (dto.categoryId) qb.andWhere('p.category_id = :cat', { cat: dto.categoryId });
    if (dto.tag) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM photo_tags pt JOIN tags t ON t.id = pt.tag_id
                 WHERE pt.photo_id = p.id AND t.slug = :tagSlug)`,
        { tagSlug: dto.tag },
      );
    }

    // Rank by text relevance when searching, else by popularity/recency.
    if (dto.q) {
      qb.orderBy(
        `ts_rank(p.search_vector, websearch_to_tsquery('english', :q))`,
        'DESC',
      ).addOrderBy('p.views_count', 'DESC');
    } else {
      qb.orderBy('p.views_count', 'DESC').addOrderBy('p.published_at', 'DESC');
    }
    qb.skip(skip).take(limit);
    const [rows, total] = await qb.getManyAndCount();

    if (dto.q) void this.analytics.recordSearch(dto.q, undefined, viewerId);

    const items = rows.map(
      (p): SearchHit => ({
        type: SearchEntityType.PHOTO,
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.locationName,
        imageId: p.id,
        imageUrl: this.photoThumb(p),
      }),
    );
    return paginate(items, total, page, limit);
  }

  /** Available facet values for building filter UIs. */
  async facets(): Promise<SearchFacets> {
    const top = (rows: Array<{ value: string | null; count: string }>) =>
      rows
        .filter((r) => r.value)
        .map((r) => ({ value: r.value as string, count: Number(r.count) }));

    const [cameras, lenses, tagRows, categoryRows] = await Promise.all([
      this.photoRepository
        .createQueryBuilder('p')
        .select('p.camera_model', 'value')
        .addSelect('COUNT(*)', 'count')
        .where('p.status = :s', { s: ContentStatus.PUBLISHED })
        .andWhere('p.camera_model IS NOT NULL')
        .groupBy('p.camera_model')
        .orderBy('count', 'DESC')
        .limit(20)
        .getRawMany<{ value: string | null; count: string }>(),
      this.photoRepository
        .createQueryBuilder('p')
        .select('p.lens_model', 'value')
        .addSelect('COUNT(*)', 'count')
        .where('p.status = :s', { s: ContentStatus.PUBLISHED })
        .andWhere('p.lens_model IS NOT NULL')
        .groupBy('p.lens_model')
        .orderBy('count', 'DESC')
        .limit(20)
        .getRawMany<{ value: string | null; count: string }>(),
      this.tagRepository.find({ order: { usageCount: 'DESC' }, take: 30 }),
      this.categoryRepository.find({ order: { photosCount: 'DESC' }, take: 30 }),
    ]);

    return {
      cameras: top(cameras),
      lenses: top(lenses),
      tags: tagRows.map((t) => ({ value: t.name, count: t.usageCount })),
      categories: categoryRows.map((c) => ({ value: c.name, slug: c.slug, count: c.photosCount })),
    };
  }
}
