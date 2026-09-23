import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Not, Repository } from 'typeorm';
import {
  ContentStatus,
  type MarketplaceAlbum,
  type Paginated,
  type PublicAlbumAsset,
  type PublicAlbumPricing,
  UserRole,
} from '@photography/types';
import { normalizePagination, paginate } from '@photography/utils';
import type { CommerceConfig } from '../../config/configuration';
import type { RequestUser } from '../../common/types/authenticated-request';
import { RedisService } from '../../redis/redis.service';
import { StorageService } from '../../storage/storage.service';
import { Album } from '../albums/entities/album.entity';
import { AlbumPricing } from '../albums/entities/album-pricing.entity';
import { AlbumAsset } from '../albums/entities/album-asset.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';
import { Entitlement } from '../orders/entities/entitlement.entity';
import {
  AlbumSaleSettingsDto,
  CreatePricingDto,
  QueryMarketplaceDto,
  RegisterAssetDto,
  SignAssetUploadDto,
  UpdatePricingDto,
} from './dto/marketplace.dto';
import {
  toMarketplaceAlbum,
  toPublicAsset,
  toPublicPricing,
  type MarketplaceViewerFlags,
} from './marketplace-album.mapper';

const RECENT_LIMIT = 20;

@Injectable()
export class MarketplaceService {
  private readonly commerce: CommerceConfig;

  constructor(
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(AlbumPricing) private readonly pricingRepository: Repository<AlbumPricing>,
    @InjectRepository(AlbumAsset) private readonly assetRepository: Repository<AlbumAsset>,
    @InjectRepository(WishlistItem) private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Entitlement) private readonly entitlementRepository: Repository<Entitlement>,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
    configService: ConfigService,
  ) {
    this.commerce = configService.getOrThrow<CommerceConfig>('commerce');
  }

  // ---------------- public reads ----------------

  async listForSale(
    query: QueryMarketplaceDto,
    viewerId?: string,
  ): Promise<Paginated<MarketplaceAlbum>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const qb = this.albumRepository
      .createQueryBuilder('album')
      .where('album.is_for_sale = true')
      .andWhere('album.status = :status', { status: ContentStatus.PUBLISHED });

    if (query.featured) qb.andWhere('album.is_featured = true');
    if (query.search) qb.andWhere('album.title ILIKE :s', { s: `%${query.search}%` });

    switch (query.sort) {
      case 'rating':
        qb.orderBy('album.rating_average', 'DESC');
        break;
      case 'sales':
        qb.orderBy('album.sales_count', 'DESC');
        break;
      case 'newest':
      default:
        qb.orderBy('album.published_at', 'DESC');
    }

    const [albums, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const items = await this.mapAlbums(albums, viewerId);
    return paginate(items, total, page, limit);
  }

  async listFeatured(viewerId?: string): Promise<MarketplaceAlbum[]> {
    const albums = await this.albumRepository.find({
      where: { isForSale: true, isFeatured: true, status: ContentStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
      take: 12,
    });
    return this.mapAlbums(albums, viewerId);
  }

  async getBySlug(slug: string, viewer?: RequestUser): Promise<MarketplaceAlbum> {
    const album = await this.albumRepository.findOne({ where: { slug } });
    if (!album || !album.isForSale || album.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Album not found');
    }
    if (viewer) await this.recordRecentlyViewed(viewer.id, album.id);
    const [mapped] = await this.mapAlbums([album], viewer?.id);
    return mapped;
  }

  async related(slug: string, viewerId?: string): Promise<MarketplaceAlbum[]> {
    const album = await this.albumRepository.findOne({ where: { slug } });
    if (!album) throw new NotFoundException('Album not found');

    let albums = await this.albumRepository.find({
      where: {
        isForSale: true,
        status: ContentStatus.PUBLISHED,
        photographerId: album.photographerId,
        id: Not(album.id),
      },
      take: 8,
      order: { salesCount: 'DESC' },
    });
    if (albums.length === 0) {
      albums = await this.albumRepository.find({
        where: { isForSale: true, status: ContentStatus.PUBLISHED, id: Not(album.id) },
        take: 8,
        order: { salesCount: 'DESC' },
      });
    }
    return this.mapAlbums(albums, viewerId);
  }

  // ---------------- recently viewed (Redis) ----------------

  private recentKey(userId: string): string {
    return `recent:albums:${userId}`;
  }

  async recordRecentlyViewed(userId: string, albumId: string): Promise<void> {
    const key = this.recentKey(userId);
    const client = this.redis.raw;
    await client.lrem(key, 0, albumId);
    await client.lpush(key, albumId);
    await client.ltrim(key, 0, RECENT_LIMIT - 1);
    await client.expire(key, 60 * 60 * 24 * 30);
  }

  async recentlyViewed(userId: string): Promise<MarketplaceAlbum[]> {
    const ids = await this.redis.raw.lrange(this.recentKey(userId), 0, RECENT_LIMIT - 1);
    if (ids.length === 0) return [];
    const albums = await this.albumRepository.find({
      where: { id: In(ids), isForSale: true, status: ContentStatus.PUBLISHED },
    });
    // Preserve recency order.
    const order = new Map(ids.map((id, i) => [id, i]));
    albums.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return this.mapAlbums(albums, userId);
  }

  // ---------------- mapping with viewer flags ----------------

  private async mapAlbums(albums: Album[], viewerId?: string): Promise<MarketplaceAlbum[]> {
    if (albums.length === 0) return [];
    const albumIds = albums.map((a) => a.id);
    const pricing = await this.pricingRepository.find({ where: { albumId: In(albumIds) } });
    const pricingByAlbum = new Map<string, AlbumPricing[]>();
    for (const p of pricing) {
      const list = pricingByAlbum.get(p.albumId) ?? [];
      list.push(p);
      pricingByAlbum.set(p.albumId, list);
    }

    let flags: (albumId: string) => MarketplaceViewerFlags = () => ({});
    if (viewerId) {
      const [wishlist, entitlements] = await Promise.all([
        this.wishlistRepository.find({
          where: { userId: viewerId, albumId: In(albumIds) },
          select: { albumId: true },
        }),
        this.entitlementRepository.find({
          where: { userId: viewerId, albumId: In(albumIds), isActive: true },
          select: { albumId: true },
        }),
      ]);
      const wished = new Set(wishlist.map((w) => w.albumId));
      const owned = new Set(entitlements.map((e) => e.albumId));
      flags = (albumId) => ({ wishlisted: wished.has(albumId), purchased: owned.has(albumId) });
    }

    return albums.map((album) =>
      toMarketplaceAlbum(album, pricingByAlbum.get(album.id) ?? [], flags(album.id)),
    );
  }

  // ---------------- ownership ----------------

  private async getOwnedAlbum(albumId: string, user: RequestUser): Promise<Album> {
    const album = await this.albumRepository.findOne({ where: { id: albumId } });
    if (!album) throw new NotFoundException('Album not found');
    if (user.role !== UserRole.ADMIN && album.photographerId !== user.id) {
      throw new ForbiddenException('You do not own this album');
    }
    return album;
  }

  // ---------------- sale settings ----------------

  async updateSaleSettings(
    albumId: string,
    dto: AlbumSaleSettingsDto,
    user: RequestUser,
  ): Promise<MarketplaceAlbum> {
    const album = await this.getOwnedAlbum(albumId, user);
    if (dto.isForSale && (await this.pricingRepository.count({ where: { albumId } })) === 0) {
      throw new BadRequestException('Add at least one pricing tier before listing for sale');
    }
    Object.assign(album, dto);
    const saved = await this.albumRepository.save(album);
    const [mapped] = await this.mapAlbums([saved], user.id);
    return mapped;
  }

  // ---------------- pricing management ----------------

  async createPricing(
    albumId: string,
    dto: CreatePricingDto,
    user: RequestUser,
  ): Promise<PublicAlbumPricing> {
    const album = await this.getOwnedAlbum(albumId, user);
    if (dto.isDefault) {
      await this.pricingRepository.update({ albumId }, { isDefault: false });
    }
    const pricing = this.pricingRepository.create({
      albumId,
      name: dto.name,
      licenseType: dto.licenseType,
      priceCents: dto.priceCents,
      currency: this.commerce.currency,
      downloadLimit: dto.downloadLimit ?? this.commerce.defaultDownloadLimit,
      includesRaw: dto.includesRaw ?? false,
      isDefault: dto.isDefault ?? false,
    });
    return toPublicPricing(album, await this.pricingRepository.save(pricing));
  }

  async listPricing(albumId: string): Promise<PublicAlbumPricing[]> {
    const album = await this.albumRepository.findOneOrFail({ where: { id: albumId } });
    const tiers = await this.pricingRepository.find({
      where: { albumId },
      order: { priceCents: 'ASC' },
    });
    return tiers.map((t) => toPublicPricing(album, t));
  }

  async updatePricing(
    albumId: string,
    pricingId: string,
    dto: UpdatePricingDto,
    user: RequestUser,
  ): Promise<PublicAlbumPricing> {
    const album = await this.getOwnedAlbum(albumId, user);
    const pricing = await this.pricingRepository.findOne({ where: { id: pricingId, albumId } });
    if (!pricing) throw new NotFoundException('Pricing tier not found');
    if (dto.isDefault) await this.pricingRepository.update({ albumId }, { isDefault: false });
    Object.assign(pricing, dto);
    return toPublicPricing(album, await this.pricingRepository.save(pricing));
  }

  async removePricing(albumId: string, pricingId: string, user: RequestUser): Promise<void> {
    await this.getOwnedAlbum(albumId, user);
    await this.pricingRepository.delete({ id: pricingId, albumId });
  }

  // ---------------- asset (deliverable) management ----------------

  /** Signed PUT URL into the PRIVATE deliverables namespace for direct upload. */
  async signAssetUpload(albumId: string, dto: SignAssetUploadDto, user: RequestUser) {
    await this.getOwnedAlbum(albumId, user);
    const ext = dto.fileName.includes('.') ? dto.fileName.split('.').pop() : 'bin';
    const storageKey = `deliverables/${albumId}/${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.getSignedUploadUrl(storageKey, dto.contentType, 900);
    return { uploadUrl, storageKey, expiresInSeconds: 900 };
  }

  async registerAsset(
    albumId: string,
    dto: RegisterAssetDto,
    user: RequestUser,
  ): Promise<PublicAlbumAsset> {
    await this.getOwnedAlbum(albumId, user);
    const asset = this.assetRepository.create({
      albumId,
      type: dto.type,
      storageKey: dto.storageKey,
      fileName: dto.fileName,
      contentType: dto.contentType,
      sizeBytes: dto.sizeBytes ?? 0,
      requiresRaw: dto.requiresRaw ?? false,
      watermarkable: dto.watermarkable ?? false,
    });
    return toPublicAsset(await this.assetRepository.save(asset));
  }

  async listAssets(albumId: string, user: RequestUser): Promise<PublicAlbumAsset[]> {
    await this.getOwnedAlbum(albumId, user);
    const assets = await this.assetRepository.find({
      where: { albumId },
      order: { createdAt: 'ASC' },
    });
    return assets.map(toPublicAsset);
  }

  async removeAsset(albumId: string, assetId: string, user: RequestUser): Promise<void> {
    await this.getOwnedAlbum(albumId, user);
    const asset = await this.assetRepository.findOne({ where: { id: assetId, albumId } });
    if (!asset) throw new NotFoundException('Asset not found');
    await this.assetRepository.softDelete({ id: assetId });
    void this.storage.delete(asset.storageKey);
  }
}
