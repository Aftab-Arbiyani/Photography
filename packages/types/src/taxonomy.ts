import type { ContentStatus } from './enums';

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverPhotoId: string | null;
  photosCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: ContentStatus;
  coverPhotoId: string | null;
  photographerId: string;
  photosCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCollection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: ContentStatus;
  coverPhotoId: string | null;
  isCurated: boolean;
  photosCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicComment {
  id: string;
  photoId: string;
  body: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}
