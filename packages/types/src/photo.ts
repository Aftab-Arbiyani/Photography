import type { ContentStatus } from './enums';

/** EXIF / capture metadata extracted from the original image. */
export interface PhotoExif {
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  /** e.g. "100" */
  iso: number | null;
  /** e.g. "1/250" */
  shutterSpeed: string | null;
  /** f-number, e.g. 2.8 */
  aperture: number | null;
  /** mm, e.g. 35 */
  focalLength: number | null;
  /** ISO 8601 timestamp the photo was taken */
  takenAt: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  /** raw, untyped exif bag for anything not normalized above */
  raw: Record<string, unknown> | null;
}

/** URLs for each generated image derivative. */
export interface PhotoAssets {
  original: string;
  thumbnail: string;
  webp: string;
  avif: string;
  /** tiny base64 blur placeholder (LQIP) */
  blurDataUrl: string | null;
}

export interface PublicPhoto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  story: string | null;
  status: ContentStatus;
  width: number;
  height: number;
  aspectRatio: number;
  assets: PhotoAssets;
  exif: PhotoExif | null;
  categoryId: string | null;
  albumId: string | null;
  photographerId: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isFeatured: boolean;
  /** present only when the request is authenticated */
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
