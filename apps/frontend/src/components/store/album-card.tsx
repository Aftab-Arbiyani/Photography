import Link from 'next/link';
import { StarFilled } from '@ant-design/icons';
import type { MarketplaceAlbum, PublicPhoto } from '@photography/types';
import { cn } from '@photography/ui';
import { PhotoFrame } from '@/components/media/photo-frame';
import { formatMoney } from '@/lib/money';

const badge = 'rounded-pill px-2.5 py-0.5 text-xs font-bold';

/**
 * Shop tile for a set. Shows `cover` when the caller has one; otherwise the
 * cover is a typographic plate (dark surface, faint ember glow, set title).
 * Hook-free on purpose, so server pages render it without hydrating it.
 */
export function AlbumCard({
  album,
  cover,
}: {
  album: MarketplaceAlbum;
  cover?: PublicPhoto | null;
}) {
  const onSale = album.discountActive && album.discountPercent > 0;

  return (
    <Link
      href={`/store/${album.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-canvas transition hover:border-ink/30 dark:bg-tile-2"
    >
      <div className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden bg-gradient-to-b from-tile-2 to-tile-3 p-4">
        {cover ? (
          <>
            <PhotoFrame
              photo={cover}
              seed={`set-${album.slug}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              imgClassName="transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"
            />
          </>
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-tr from-primary/25 via-primary/5 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
            />
            <div aria-hidden className="film-grain absolute inset-0" />
          </>
        )}
        {(album.isFeatured || onSale) && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {album.isFeatured && (
              <span className={cn(badge, 'bg-canvas/90 text-ink-fixed')}>Featured</span>
            )}
            {onSale && (
              <span className={cn(badge, 'bg-primary text-ink-fixed')}>
                -{album.discountPercent}%
              </span>
            )}
          </div>
        )}
        <h3 className="font-display relative line-clamp-2 text-xl font-bold leading-tight tracking-tight text-white">
          {album.title}
        </h3>
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 p-4">
        <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span>
            {album.photosCount} {album.photosCount === 1 ? 'photo' : 'photos'}
          </span>
          {album.ratingCount > 0 && (
            <span className="flex items-center gap-1">
              <StarFilled aria-hidden className="!text-primary" />
              <span className="sr-only">Rated </span>
              {album.ratingAverage.toFixed(1)}
              <span className="sr-only"> out of 5 from {album.ratingCount} reviews</span>
            </span>
          )}
        </p>
        {album.fromPriceCents !== null ? (
          <span className="shrink-0 rounded-pill bg-primary px-3 py-1 text-sm font-bold text-ink-fixed">
            {album.pricing.length > 1 && 'From '}
            {formatMoney(album.fromPriceCents, album.currency)}
          </span>
        ) : (
          <span className="shrink-0 rounded-pill bg-ink/10 px-3 py-1 text-sm font-semibold text-ink-muted">
            Coming soon
          </span>
        )}
      </div>
    </Link>
  );
}
