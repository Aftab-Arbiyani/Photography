import type { MarketplaceAlbum, PublicAlbumAsset, PublicAlbumPricing } from '@photography/types';
import { Album } from '../albums/entities/album.entity';
import { AlbumPricing } from '../albums/entities/album-pricing.entity';
import { AlbumAsset } from '../albums/entities/album-asset.entity';
import { PricingService } from '../cart/pricing.service';

export interface MarketplaceViewerFlags {
  wishlisted?: boolean;
  purchased?: boolean;
}

export function toPublicPricing(album: Album, p: AlbumPricing): PublicAlbumPricing {
  return {
    id: p.id,
    albumId: p.albumId,
    name: p.name,
    licenseType: p.licenseType,
    priceCents: p.priceCents,
    currency: p.currency,
    downloadLimit: p.downloadLimit,
    includesRaw: p.includesRaw,
    isDefault: p.isDefault,
    effectivePriceCents: PricingService.applyDiscount(
      p.priceCents,
      album.discountPercent,
      album.discountActive,
    ),
  };
}

export function toPublicAsset(a: AlbumAsset): PublicAlbumAsset {
  return {
    id: a.id,
    albumId: a.albumId,
    type: a.type,
    fileName: a.fileName,
    sizeBytes: Number(a.sizeBytes),
    contentType: a.contentType,
    requiresRaw: a.requiresRaw,
  };
}

export function toMarketplaceAlbum(
  album: Album,
  pricing: AlbumPricing[],
  flags: MarketplaceViewerFlags = {},
): MarketplaceAlbum {
  const publicPricing = pricing.map((p) => toPublicPricing(album, p));
  const fromPriceCents = publicPricing.length
    ? Math.min(...publicPricing.map((p) => p.effectivePriceCents))
    : null;

  const result: MarketplaceAlbum = {
    id: album.id,
    title: album.title,
    slug: album.slug,
    description: album.description,
    coverPhotoId: album.coverPhotoId,
    photographerId: album.photographerId,
    photosCount: album.photosCount,
    isForSale: album.isForSale,
    isFeatured: album.isFeatured,
    trailerUrl: album.trailerUrl,
    discountPercent: album.discountPercent,
    discountActive: album.discountActive,
    ratingAverage: Number(album.ratingAverage),
    ratingCount: album.ratingCount,
    salesCount: album.salesCount,
    pricing: publicPricing,
    fromPriceCents,
    currency: publicPricing[0]?.currency ?? 'usd',
    publishedAt: album.publishedAt?.toISOString() ?? null,
    createdAt: album.createdAt.toISOString(),
  };
  if (flags.wishlisted !== undefined) result.wishlisted = flags.wishlisted;
  if (flags.purchased !== undefined) result.purchased = flags.purchased;
  return result;
}
