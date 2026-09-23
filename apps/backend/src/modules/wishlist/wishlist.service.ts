import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentStatus, type MarketplaceAlbum } from '@photography/types';
import { Album } from '../albums/entities/album.entity';
import { AlbumPricing } from '../albums/entities/album-pricing.entity';
import { toMarketplaceAlbum } from '../marketplace/marketplace-album.mapper';
import { WishlistItem } from './entities/wishlist-item.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem) private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(AlbumPricing) private readonly pricingRepository: Repository<AlbumPricing>,
  ) {}

  async add(userId: string, albumId: string): Promise<{ wishlisted: true }> {
    const album = await this.albumRepository.findOne({ where: { id: albumId } });
    if (!album) throw new NotFoundException('Album not found');
    const existing = await this.wishlistRepository.findOne({ where: { userId, albumId } });
    if (!existing) await this.wishlistRepository.insert({ userId, albumId });
    return { wishlisted: true };
  }

  async remove(userId: string, albumId: string): Promise<{ wishlisted: false }> {
    await this.wishlistRepository.delete({ userId, albumId });
    return { wishlisted: false };
  }

  async list(userId: string): Promise<MarketplaceAlbum[]> {
    const items = await this.wishlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const albumIds = items.map((i) => i.albumId);
    if (albumIds.length === 0) return [];

    const [albums, pricing] = await Promise.all([
      this.albumRepository.find({ where: { id: In(albumIds), status: ContentStatus.PUBLISHED } }),
      this.pricingRepository.find({ where: { albumId: In(albumIds) } }),
    ]);
    const pricingByAlbum = new Map<string, AlbumPricing[]>();
    for (const p of pricing) {
      const list = pricingByAlbum.get(p.albumId) ?? [];
      list.push(p);
      pricingByAlbum.set(p.albumId, list);
    }
    const order = new Map(albumIds.map((id, i) => [id, i]));
    return albums
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((a) => toMarketplaceAlbum(a, pricingByAlbum.get(a.id) ?? [], { wishlisted: true }));
  }
}
