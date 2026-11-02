import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRightOutlined, DownOutlined } from '@ant-design/icons';
import type {
  MarketplaceAlbum,
  PhotoExif,
  PublicPhoto,
  PublicPhotographer,
  PublicTag,
} from '@photography/types';
import { PhotoGrid } from '@/components/gallery/photo-grid';
import { CommentsSection } from '@/components/photo/comments-section';
import { ExifPanel } from '@/components/photo/exif-panel';
import { PhotoActions } from '@/components/photo/photo-actions';
import { PhotoSocial } from '@/components/photo/photo-social';
import { api } from '@/lib/api';
import { siteConfig } from '@/lib/config';
import { formatMoney } from '@/lib/money';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Extended captions past this length (or line count) clamp behind "Read more". */
const STORY_PREVIEW_CHARS = 280;
const STORY_PREVIEW_LINES = 4;

// Fixed locale + UTC: the date is rendered once on the server.
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

async function getPhoto(slug: string): Promise<PublicPhoto | null> {
  return api.photo(slug).catch(() => null);
}

/**
 * The shop set a photo belongs to, if that set is on sale. Sets can only be
 * looked up by slug, so match the album id against the storefront listing: one
 * page at the API's 100-item cap covers a single creator's catalogue, and the
 * shared URL is served from the fetch cache across photo pages.
 */
async function getShopSet(albumId: string | null): Promise<MarketplaceAlbum | null> {
  if (!albumId) return null;
  const page = await api.shopAlbums('?limit=100').catch(() => null);
  return page?.items.find((album) => album.id === albumId) ?? null;
}

/** Whitespace-collapsed excerpt cut at a word boundary, for meta descriptions. */
function excerpt(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, '')}…`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const photo = await getPhoto(slug);
  if (!photo) return buildMetadata({ title: 'Photo not found', path: `/photos/${slug}` });
  const summary = photo.description?.trim() || photo.story?.trim();
  return buildMetadata({
    title: photo.title,
    description: summary ? excerpt(summary) : siteConfig.description,
    path: `/photos/${photo.slug}`,
    image: photo.assets.webp || photo.assets.original,
    type: 'article',
  });
}

function imageObjectJsonLd(photo: PublicPhoto) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: photo.title,
    description: photo.description ?? undefined,
    contentUrl: photo.assets.original,
    thumbnailUrl: photo.assets.thumbnail,
    width: photo.width,
    height: photo.height,
    uploadDate: photo.publishedAt ?? photo.createdAt,
  };
}

/** JSON for an inline script tag; `<` is escaped so no text field can close the tag. */
function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Stage box for the photo: the intrinsic ratio, as wide as the column allows
 * while the height stays within 80svh, and never upscaled past the original.
 * The blur placeholder fills it until the image paints.
 */
function stageStyle({ width, height, assets }: PublicPhoto): CSSProperties {
  const sized = width > 0 && height > 0;
  return {
    maxWidth: sized ? `min(${width}px, calc(80svh * ${(width / height).toFixed(4)}))` : '100%',
    aspectRatio: sized ? `${width} / ${height}` : undefined,
    backgroundImage: assets.blurDataUrl ? `url(${assets.blurDataUrl})` : undefined,
    backgroundSize: 'cover',
  };
}

/** True when the EXIF carries anything the camera-details table would list. */
function hasCameraDetails(exif: PhotoExif | null): exif is PhotoExif {
  if (!exif) return false;
  const { cameraMake, cameraModel, lensModel, iso, shutterSpeed, aperture, focalLength, takenAt } =
    exif;
  return [
    cameraMake,
    cameraModel,
    lensModel,
    iso,
    shutterSpeed,
    aperture,
    focalLength,
    takenAt,
  ].some((value) => (value ?? '') !== '');
}

function formatDate(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

export default async function PhotoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const photo = await getPhoto(slug);
  if (!photo) notFound();

  // Everything around the photo is best-effort: each read degrades to "absent".
  const [related, tags, creator, shopSet] = await Promise.all([
    api.relatedPhotos(slug).catch((): PublicPhoto[] => []),
    api.photoTags(photo.id).catch((): PublicTag[] => []),
    api.photographer(photo.photographerId).catch((): PublicPhotographer | null => null),
    getShopSet(photo.albumId),
  ]);

  const story = photo.story?.trim();
  const publishedAt = photo.publishedAt ?? photo.createdAt;

  return (
    <>
      <article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(imageObjectJsonLd(photo)) }}
        />

        {/* Stage: always dark, so the frame reads the same in either theme. A plain
            server-rendered picture (not ResponsiveImage) so the LCP image paints
            without waiting for hydration. */}
        <div className="bg-tile-3">
          <div className="mx-auto max-w-wide px-2 py-4 sm:px-5 sm:py-8">
            <div className="mx-auto w-full bg-tile-2" style={stageStyle(photo)}>
              <picture>
                {photo.assets.avif && <source srcSet={photo.assets.avif} type="image/avif" />}
                {photo.assets.webp && <source srcSet={photo.assets.webp} type="image/webp" />}
                <img
                  src={photo.assets.webp || photo.assets.original}
                  alt={photo.title}
                  width={photo.width}
                  height={photo.height}
                  fetchPriority="high"
                  decoding="async"
                  className="block h-full w-full object-contain"
                />
              </picture>
            </div>
          </div>
        </div>

        {/* Mobile stacks info → buy → comments; desktop keeps comments under the
            info column and runs the sidebar down the side. */}
        <div className="mx-auto grid max-w-wide gap-x-12 gap-y-8 px-5 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr]">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <h1 className="font-display text-lead font-bold tracking-tight">{photo.title}</h1>
            <CreatorLine
              photographerId={photo.photographerId}
              creator={creator}
              publishedAt={publishedAt}
            />

            <div className="mt-5">
              <PhotoActions photo={photo}>
                <PhotoSocial photoId={photo.id} photoSlug={photo.slug} />
              </PhotoActions>
            </div>

            {(photo.description || story) && (
              <div className="mt-6 max-w-prose space-y-3 leading-relaxed">
                {photo.description && (
                  <p className="whitespace-pre-line text-ink">{photo.description}</p>
                )}
                {story && <ExtendedCaption text={story} />}
              </div>
            )}

            {tags.length > 0 && (
              <ul aria-label="Tags" className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={`/search?q=${encodeURIComponent(tag.name)}`}
                      className="inline-block rounded-pill border border-hairline px-3 py-1 text-xs font-semibold text-ink-muted transition hover:border-ink/40 hover:text-ink"
                    >
                      #{tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <BuyCard set={shopSet} />
            {hasCameraDetails(photo.exif) && <CameraDetails exif={photo.exif} />}
          </aside>

          {/* CommentsSection brings its own top margin; the divider spaces it here. */}
          <div className="min-w-0 border-t border-hairline pt-8 lg:col-start-1 lg:row-start-2 [&>section]:mt-0">
            <CommentsSection photoId={photo.id} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="mx-auto max-w-wide px-4 pb-20 sm:px-5"
        >
          <div className="border-t border-hairline pt-10">
            <h2
              id="related-heading"
              className="font-display mb-4 text-tagline font-bold tracking-tight"
            >
              More like this
            </h2>
            <PhotoGrid photos={related} rowHeight={200} />
          </div>
        </section>
      )}
    </>
  );
}

function CreatorLine({
  photographerId,
  creator,
  publishedAt,
}: {
  photographerId: string;
  creator: PublicPhotographer | null;
  publishedAt: string;
}) {
  const name = creator?.displayName ?? siteConfig.name;
  const date = formatDate(publishedAt);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
      <span className="sr-only">By</span>
      <Link
        href={`/photographers/${photographerId}`}
        className="inline-flex items-center gap-2 font-semibold text-ink transition hover:text-primary"
      >
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-tile-2 text-xs font-bold text-white"
        >
          {creator?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage-served avatar
            <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
        {name}
      </Link>
      {date && (
        <>
          <span aria-hidden>·</span>
          <time dateTime={publishedAt}>{date}</time>
        </>
      )}
    </div>
  );
}

/**
 * `photo.story` as secondary text. Long ones clamp to four lines; a native
 * disclosure lifts the clamp. The full text is always in the DOM, so screen
 * readers get all of it either way.
 */
function ExtendedCaption({ text }: { text: string }) {
  const long = text.length > STORY_PREVIEW_CHARS || text.split('\n').length > STORY_PREVIEW_LINES;
  if (!long) return <p className="whitespace-pre-line text-ink-muted">{text}</p>;

  return (
    <div className="group/story">
      {/* Collapsed, paragraphs run together so the clamp never ends on a blank line. */}
      <p className="line-clamp-4 text-ink-muted group-has-[details[open]]/story:line-clamp-none group-has-[details[open]]/story:whitespace-pre-line">
        {text}
      </p>
      <details className="group/more mt-1">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded text-sm font-semibold text-primary transition hover:text-primary-focus [&::-webkit-details-marker]:hidden">
          <span className="group-open/more:hidden">Read more</span>
          <span className="hidden group-open/more:inline">Show less</span>
          <DownOutlined
            aria-hidden
            className="text-[10px] transition-transform group-open/more:rotate-180"
          />
        </summary>
      </details>
    </div>
  );
}

/** Sidebar shop card: the photo's own set when it is on sale, else the shop. */
function BuyCard({ set }: { set: MarketplaceAlbum | null }) {
  const onSale = set !== null && set.discountActive && set.discountPercent > 0;
  const priced = set !== null && set.fromPriceCents !== null;

  return (
    <section
      aria-labelledby="buy-heading"
      className="relative overflow-hidden rounded-card border border-hairline bg-canvas p-5 dark:bg-tile-2"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/10 to-transparent"
      />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {set ? 'Part of a set' : 'Shop'}
        </p>
        <h2 id="buy-heading" className="font-display mt-2 text-tagline font-bold tracking-tight">
          {set ? set.title : 'Full-res sets'}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {!set
            ? 'High-res sets and downloads by the creator are in the shop.'
            : set.photosCount > 1
              ? `One of ${set.photosCount} photos in this set, available as a full-resolution download.`
              : 'Available as a full-resolution download.'}
        </p>

        {set && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {set.fromPriceCents !== null ? (
              <>
                {set.pricing.length > 1 && <span className="text-ink-muted">From</span>}
                <span className="font-display text-xl font-bold">
                  {formatMoney(set.fromPriceCents, set.currency)}
                </span>
              </>
            ) : (
              <span className="text-ink-muted">Pricing coming soon</span>
            )}
            {onSale && (
              <span className="rounded-pill bg-primary px-2 py-0.5 text-xs font-bold text-ink-fixed">
                -{set.discountPercent}%
              </span>
            )}
          </p>
        )}

        <Link
          href={set ? `/store/${set.slug}` : '/store'}
          className="group mt-5 flex h-11 items-center justify-center gap-2 rounded-pill bg-primary px-5 text-sm font-bold text-ink-fixed transition hover:bg-primary-focus active:scale-[0.98]"
        >
          {!set ? 'Browse the shop' : priced ? 'Buy the full-res set' : 'View the set'}
          <ArrowRightOutlined
            aria-hidden
            className="text-xs transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}

/**
 * EXIF table behind a collapsed disclosure. ExifPanel brings its own card and
 * heading; the disclosure supplies both here, so those are neutralised.
 */
function CameraDetails({ exif }: { exif: PhotoExif }) {
  return (
    <details className="group/exif rounded-card border border-hairline bg-canvas dark:bg-tile-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-card px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        Camera details
        <DownOutlined
          aria-hidden
          className="text-xs !text-ink-muted transition-transform group-open/exif:rotate-180"
        />
      </summary>
      <div className="border-t border-hairline px-5 pb-2 [&>div]:rounded-none [&>div]:border-0 [&>div]:p-0 [&_h2]:hidden">
        <ExifPanel exif={exif} />
      </div>
    </details>
  );
}
