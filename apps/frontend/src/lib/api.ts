import type {
  ApiResponse,
  CursorPaginated,
  Paginated,
  PublicAlbum,
  PublicCategory,
  PublicCmsPage,
  PublicCollection,
  PublicPhoto,
} from '@photography/types';
import { siteConfig } from './config';

/** Thrown for any non-2xx API response. */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions extends RequestInit {
  /** Bearer access token, when calling authenticated endpoints. */
  token?: string;
}

/**
 * Minimal typed fetch wrapper around the backend. Unwraps the standard
 * { success, data } envelope and surfaces errors as ApiClientError.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const res = await fetch(`${siteConfig.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    // ISR-friendly default; callers can override.
    next: init.next ?? { revalidate: 60 },
  });

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | { message?: string } | null;

  if (!res.ok || !json || !('success' in json) || !json.success) {
    const message =
      (json &&
        'message' in json &&
        (Array.isArray(json.message) ? json.message.join(', ') : json.message)) ||
      `Request failed (${res.status})`;
    throw new ApiClientError(res.status, message as string);
  }

  return json.data;
}

/** Read-only endpoints used by server components. The next phase adds auth/mutations. */
export const api = {
  gallery: (query = '') => request<CursorPaginated<PublicPhoto>>(`/photos${query}`),
  photo: (slug: string) => request<PublicPhoto>(`/photos/${slug}`),
  relatedPhotos: (slug: string) => request<PublicPhoto[]>(`/photos/${slug}/related`),
  categories: () => request<PublicCategory[]>('/categories'),
  albums: () => request<Paginated<PublicAlbum>>('/albums'),
  album: (slug: string) => request<PublicAlbum>(`/albums/${slug}`),
  collections: () => request<Paginated<PublicCollection>>('/collections'),
  collection: (slug: string) => request<PublicCollection>(`/collections/${slug}`),
  collectionPhotos: (slug: string) => request<PublicPhoto[]>(`/collections/${slug}/photos`),
  /** Published CMS page by slug (ISR — content pages change rarely). */
  cmsPage: (slug: string) =>
    request<PublicCmsPage>(`/pages/${slug}`, { next: { revalidate: 300 } }),
};
