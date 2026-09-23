import type { Metadata } from 'next';
import type {
  CursorPaginated,
  Paginated,
  PublicCategory,
  PublicCollection,
  PublicPhoto,
} from '@photography/types';
import { Hero } from '@/components/landing/hero';
import { FeaturedMosaic } from '@/components/landing/featured-mosaic';
import { LatestRail } from '@/components/landing/latest-rail';
import { SplitFeature } from '@/components/landing/split-feature';
import { CollectionShowcase, type ShowcaseEntry } from '@/components/landing/collection-showcase';
import { CategoryStrip } from '@/components/landing/category-strip';
import { CtaBand } from '@/components/landing/cta-band';
import { api } from '@/lib/api';
import { buildMetadata, organizationJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({ path: '/' });

/** ISR: the landing page is photo-driven, so it refreshes on a short cycle. */
export const revalidate = 120;

const EMPTY_PHOTOS: CursorPaginated<PublicPhoto> = { items: [], nextCursor: null, hasMore: false };
const EMPTY_COLLECTIONS: Paginated<PublicCollection> = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

/** Every fetch degrades to empty — the layout holds with placeholder plates. */
async function loadLanding() {
  const [featured, latest, collections, categories] = await Promise.all([
    api.gallery('?featured=true&limit=12').catch(() => EMPTY_PHOTOS),
    api.gallery('?limit=18').catch(() => EMPTY_PHOTOS),
    api.collections().catch(() => EMPTY_COLLECTIONS),
    api.categories().catch((): PublicCategory[] => []),
  ]);

  // Prefer curated frames; fall back to the newest work when nothing is featured.
  const showcase = featured.items.length ? featured.items : latest.items;

  const entries: ShowcaseEntry[] = await Promise.all(
    collections.items.slice(0, 3).map(async (collection) => ({
      collection,
      cover: await api
        .collectionPhotos(collection.slug)
        .then((photos) => photos[0] ?? null)
        .catch(() => null),
    })),
  );

  return { showcase, latest: latest.items, entries, categories };
}

export default async function HomePage() {
  const { showcase, latest, entries, categories } = await loadLanding();

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD organization schema for rich results
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />

      <Hero photos={showcase.slice(0, 5)} />

      <FeaturedMosaic photos={showcase.slice(0, 6)} />

      <SplitFeature
        tone="parchment"
        eyebrow="The gallery"
        title="Every frame, at its best."
        body="Infinite-scroll masonry, fullscreen viewing, zoom and slideshow — served as AVIF and WebP with instant blur placeholders."
        points={[
          'AVIF and WebP derivatives generated on upload',
          'Blur placeholders, so nothing ever pops in',
          'Keyboard-driven lightbox with zoom and slideshow',
        ]}
        ctaHref="/gallery"
        ctaLabel="Open the gallery"
        photo={showcase[1] ?? null}
        seed="split-gallery"
      />

      <LatestRail photos={latest.length ? latest : showcase} />

      <SplitFeature
        flip
        tone="light"
        eyebrow="Stories"
        title="The story behind the image."
        body="Camera, lens, ISO, shutter and aperture — alongside the words that explain why the photograph exists at all."
        points={[
          'EXIF read straight from the original file',
          'Long-form story field on every photograph',
          'Comments and likes from the community',
        ]}
        ctaHref="/gallery"
        ctaLabel="Read the stories"
        photo={showcase[2] ?? null}
        seed="split-stories"
      />

      <CollectionShowcase entries={entries} />

      <CategoryStrip categories={categories} photos={showcase.length ? showcase : latest} />

      <CtaBand photo={showcase[3] ?? latest[0] ?? null} />
    </>
  );
}
