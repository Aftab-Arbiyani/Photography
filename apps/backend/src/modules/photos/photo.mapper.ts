import type { PublicPhoto, PhotoAssets, PhotoExif } from '@photography/types';
import { StorageService } from '../../storage/storage.service';
import { Photo } from './entities/photo.entity';

export interface PhotoViewerContext {
  likedPhotoIds?: Set<string>;
  bookmarkedPhotoIds?: Set<string>;
}

/**
 * Maps a Photo entity to its API representation, resolving storage keys to URLs
 * and (optionally) annotating viewer-specific flags (likedByMe / bookmarkedByMe).
 */
export function toPublicPhoto(
  photo: Photo,
  storage: StorageService,
  ctx: PhotoViewerContext = {},
): PublicPhoto {
  const url = (key: string | null): string => (key ? storage.getPublicUrl(key) : '');

  const assets: PhotoAssets = {
    original: url(photo.storageKey),
    thumbnail: url(photo.thumbnailKey) || url(photo.storageKey),
    webp: url(photo.webpKey) || url(photo.storageKey),
    avif: url(photo.avifKey) || url(photo.storageKey),
    blurDataUrl: photo.blurDataUrl,
  };

  const exif: PhotoExif | null =
    photo.cameraMake || photo.cameraModel || photo.iso || photo.lensModel
      ? {
          cameraMake: photo.cameraMake,
          cameraModel: photo.cameraModel,
          lensModel: photo.lensModel,
          iso: photo.iso,
          shutterSpeed: photo.shutterSpeed,
          aperture: photo.aperture,
          focalLength: photo.focalLength,
          takenAt: photo.takenAt?.toISOString() ?? null,
          gpsLatitude: photo.gpsLatitude,
          gpsLongitude: photo.gpsLongitude,
          raw: null, // raw bag is not exposed publicly
        }
      : null;

  const result: PublicPhoto = {
    id: photo.id,
    title: photo.title,
    slug: photo.slug,
    description: photo.description,
    story: photo.story,
    status: photo.status,
    width: photo.width,
    height: photo.height,
    aspectRatio: photo.aspectRatio,
    assets,
    exif,
    categoryId: photo.categoryId,
    albumId: photo.albumId,
    photographerId: photo.photographerId,
    likesCount: photo.likesCount,
    commentsCount: photo.commentsCount,
    viewsCount: photo.viewsCount,
    isFeatured: photo.isFeatured,
    publishedAt: photo.publishedAt?.toISOString() ?? null,
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
  };

  if (ctx.likedPhotoIds) result.likedByMe = ctx.likedPhotoIds.has(photo.id);
  if (ctx.bookmarkedPhotoIds) result.bookmarkedByMe = ctx.bookmarkedPhotoIds.has(photo.id);

  return result;
}
