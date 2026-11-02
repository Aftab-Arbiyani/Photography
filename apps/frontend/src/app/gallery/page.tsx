import type { Metadata } from 'next';
import type { CursorPaginated, PublicCategory, PublicPhoto } from '@photography/types';
import { GalleryClient } from '@/components/gallery/gallery-client';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Discover',
  description:
    'Browse every photo in the gallery. Fave the ones you love and buy the full-res sets in the shop.',
  path: '/gallery',
});

// Always render fresh on the server; the client takes over for pagination.
export const dynamic = 'force-dynamic';

const EMPTY: CursorPaginated<PublicPhoto> = { items: [], nextCursor: null, hasMore: false };

interface GalleryPageProps {
  /** `?category=<slug>` deep-links from the landing page's subject tiles. */
  searchParams: Promise<{ category?: string }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { category } = await searchParams;

  // Degrade gracefully if the API is unreachable at request time.
  const categories = await api.categories().catch((): PublicCategory[] => []);
  const selected = category ? (categories.find((c) => c.slug === category) ?? null) : null;

  const initial = await api
    .gallery(`?limit=24${selected ? `&categoryId=${selected.id}` : ''}`)
    .catch(() => EMPTY);

  return (
    <GalleryClient
      // Same-route navigations (e.g. ?category=a → /gallery) don't remount the
      // client; keying on the filter makes it adopt the fresh server props.
      key={selected?.id ?? 'all'}
      categories={categories}
      initial={initial}
      initialCategoryId={selected?.id ?? null}
    />
  );
}
