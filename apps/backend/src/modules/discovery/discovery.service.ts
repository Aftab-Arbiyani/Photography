import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContentStatus,
  SearchEntityType,
  type SearchHit,
  type TrendingResult,
} from '@photography/types';
import { RedisService } from '../../redis/redis.service';
import { StorageService } from '../../storage/storage.service';
import { Album } from '../albums/entities/album.entity';
import { Collection } from '../collections/entities/collection.entity';
import { Photo } from '../photos/entities/photo.entity';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(Collection) private readonly collectionRepository: Repository<Collection>,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  /** Drop discovery caches so the next request recomputes (called by the cron). */
  async invalidate(): Promise<void> {
    await this.redis.del(
      'discovery:trending:photos',
      'discovery:popular:albums',
      'discovery:featured:collections',
    );
  }

  private async cached<T>(key: string, producer: () => Promise<T[]>): Promise<TrendingResult<T>> {
    const hit = await this.redis.get<TrendingResult<T>>(key);
    if (hit) return hit;
    const items = await producer();
    const result: TrendingResult<T> = { items, generatedAt: new Date().toISOString() };
    await this.redis.set(key, result, CACHE_TTL);
    return result;
  }

  /** Weighted recent engagement: views + likes·3 + shares·2 + comments·2. */
  trendingPhotos(): Promise<TrendingResult<SearchHit>> {
    return this.cached('discovery:trending:photos', async () => {
      const photos = await this.photoRepository
        .createQueryBuilder('p')
        .where('p.status = :s', { s: ContentStatus.PUBLISHED })
        .orderBy(
          '(p.views_count + p.likes_count * 3 + p.shares_count * 2 + p.comments_count * 2)',
          'DESC',
        )
        .addOrderBy('p.published_at', 'DESC')
        .take(24)
        .getMany();
      return photos.map(
        (p): SearchHit => ({
          type: SearchEntityType.PHOTO,
          id: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.locationName,
          imageId: p.id,
          imageUrl: this.storage.getPublicUrl(p.thumbnailKey ?? p.storageKey),
        }),
      );
    });
  }

  popularAlbums(): Promise<TrendingResult<SearchHit>> {
    return this.cached('discovery:popular:albums', async () => {
      const albums = await this.albumRepository
        .createQueryBuilder('a')
        .where('a.status = :s', { s: ContentStatus.PUBLISHED })
        .orderBy('a.sales_count', 'DESC')
        .addOrderBy('a.rating_average', 'DESC')
        .take(12)
        .getMany();
      return albums.map(
        (a): SearchHit => ({
          type: SearchEntityType.ALBUM,
          id: a.id,
          slug: a.slug,
          title: a.title,
          subtitle: null,
          imageId: a.coverPhotoId,
        }),
      );
    });
  }

  featuredCollections(): Promise<TrendingResult<SearchHit>> {
    return this.cached('discovery:featured:collections', async () => {
      const collections = await this.collectionRepository.find({
        where: { status: ContentStatus.PUBLISHED, isCurated: true },
        order: { createdAt: 'DESC' },
        take: 12,
      });
      return collections.map(
        (c): SearchHit => ({
          type: SearchEntityType.COLLECTION,
          id: c.id,
          slug: c.slug,
          title: c.title,
          subtitle: null,
          imageId: c.coverPhotoId,
        }),
      );
    });
  }
}
