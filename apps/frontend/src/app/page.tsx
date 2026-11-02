import type { Metadata } from 'next';
import type {
  CursorPaginated,
  MarketplaceAlbum,
  PublicCategory,
  PublicPhoto,
} from '@photography/types';
import { PhotoWallHero } from '@/components/landing/photo-wall-hero';
import { CategoryTiles, type CategoryTile } from '@/components/landing/category-tiles';
import { HomeSection } from '@/components/landing/home-section';
import { JoinBand } from '@/components/landing/join-band';
import { PhotoGrid } from '@/components/gallery/photo-grid';
import { PlaceholderGrid } from '@/components/gallery/placeholder-grid';
import { AlbumCard } from '@/components/store/album-card';
import { api } from '@/lib/api';
import { buildMetadata, organizationJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({ path: '/' });

/** ISR: the landing page is photo-driven, so it refreshes on a short cycle. */
export const revalidate = 120;

const EMPTY_PHOTOS: CursorPaginated<PublicPhoto> = { items: [], nextCursor: null, hasMore: false };
const MAX_CATEGORY_TILES = 8;
const SHOP_ROW = 4;

/** First photo matching a gallery query, or null — used for cover images. */
const firstPhoto = (query: string) =>
  api
    .gallery(`${query}&limit=1`)
    .then((page) => page.items[0] ?? null)
    .catch(() => null);

/**
 * Every fetch degrades to empty. With no photos published yet the page still
 * holds its shape: the wall, grids and band fall back to generated plates.
 */
async function loadLanding() {
  const [featured, latest, shop, categories] = await Promise.all([
    api.gallery('?featured=true&limit=24').catch(() => EMPTY_PHOTOS),
    // 60 is the API's cursor-page cap.
    api.gallery('?limit=60').catch(() => EMPTY_PHOTOS),
    api.shopAlbums(`?limit=${SHOP_ROW}&sort=sales`).catch(() => null),
    api.categories().catch((): PublicCategory[] => []),
  ]);

  const shopAlbums: MarketplaceAlbum[] = shop?.items ?? [];
  const browsable = categories.slice(0, MAX_CATEGORY_TILES);

  // Covers: one cheap lookup per tile, in parallel.
  const [categoryCovers, setCovers] = await Promise.all([
    Promise.all(browsable.map((c) => firstPhoto(`?categoryId=${c.id}`))),
    Promise.all(shopAlbums.map((a) => firstPhoto(`?albumId=${a.id}`))),
  ]);

  // Curated frames lead; without any, split the newest work so nothing repeats.
  const hasFeatured = featured.items.length > 0;
  const picks = hasFeatured ? featured.items : latest.items.slice(0, 18);
  const pickIds = new Set(picks.map((p) => p.id));
  const fresh = latest.items.filter((p) => !pickIds.has(p.id));

  return {
    wall: latest.items.length ? latest.items : picks,
    picks,
    fresh,
    shop: shopAlbums.map((album, i) => ({ album, cover: setCovers[i] })),
    setCount: shop?.meta.totalItems ?? 0,
    photoCount: categories.reduce((sum, c) => sum + c.photosCount, 0) || latest.items.length,
    categoryTiles: browsable.map(
      (category, i): CategoryTile => ({ category, cover: categoryCovers[i] }),
    ),
  };
}

export default async function HomePage() {
  const { wall, picks, fresh, shop, setCount, photoCount, categoryTiles } = await loadLanding();

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD organization schema for rich results
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />

      <PhotoWallHero photos={wall} photoCount={photoCount} setCount={setCount} />

      {categoryTiles.length > 0 && (
        <HomeSection title="Browse by subject" href="/gallery" linkLabel="All photos">
          <CategoryTiles tiles={categoryTiles} />
        </HomeSection>
      )}

      <HomeSection
        title="Featured work"
        subtitle="Hand-picked frames from the gallery."
        href="/gallery"
      >
        {picks.length ? (
          <PhotoGrid photos={picks} rowHeight={300} priorityCount={4} />
        ) : (
          <PlaceholderGrid seed="featured" count={12} rowHeight={300} />
        )}
      </HomeSection>

      {shop.length > 0 && (
        <HomeSection
          title="Sets for sale"
          subtitle="Full-resolution sets, delivered instantly."
          href="/store"
          linkLabel="Visit the shop"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shop.map(({ album, cover }) => (
              <AlbumCard key={album.id} album={album} cover={cover} />
            ))}
          </div>
        </HomeSection>
      )}

      {fresh.length > 0 && (
        <HomeSection title="Fresh uploads" href="/gallery" linkLabel="See everything">
          <PhotoGrid photos={fresh} rowHeight={240} />
        </HomeSection>
      )}

      <JoinBand photo={picks[1] ?? wall[0] ?? null} />
    </>
  );
}
