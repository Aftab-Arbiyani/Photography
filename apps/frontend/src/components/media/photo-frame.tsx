import type { PublicPhoto } from '@photography/types';
import { cn } from '@photography/ui';
import { artDataUri } from '@/lib/placeholder-art';

interface PhotoFrameProps {
  /** The photograph to render; when absent the seeded placeholder plate is used. */
  photo?: PublicPhoto | null;
  /** Stable seed for the placeholder plate (keeps SSR and client identical). */
  seed: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  /** Film grain on the placeholder — for hero-sized surfaces only. */
  grain?: boolean;
  /** Pin the placeholder's colour grade instead of deriving it from the seed. */
  palette?: number;
  /** Classes for the fill wrapper (positioning is already absolute inset-0). */
  className?: string;
  /** Classes for the <img> itself, e.g. group-hover scale transforms. */
  imgClassName?: string;
}

/**
 * Fill-style photographic surface: absolutely covers its (relative, overflow-hidden)
 * parent, serving AVIF → WebP → original with the LQIP blur behind it. Falls back
 * to generated placeholder art so no frame on the page is ever empty.
 *
 * Deliberately a plain <img> rather than next/image: photo URLs come from the
 * storage layer (local disk or S3) and are already derivative-optimised by the
 * backend, so the Next optimiser would only re-encode work that is done.
 */
export function PhotoFrame({
  photo,
  seed,
  alt,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  grain = false,
  palette,
  className,
  imgClassName,
}: PhotoFrameProps) {
  const plate = artDataUri(seed, grain, palette);

  if (!photo) {
    return (
      <div
        aria-hidden
        className={cn('absolute inset-0 bg-cover bg-center', className)}
        style={{ backgroundImage: `url("${plate}")` }}
      />
    );
  }

  return (
    <div
      className={cn('absolute inset-0 bg-cover bg-center', className)}
      style={{ backgroundImage: `url("${photo.assets.blurDataUrl ?? plate}")` }}
    >
      <picture className="block h-full w-full">
        {photo.assets.avif && <source srcSet={photo.assets.avif} type="image/avif" sizes={sizes} />}
        {photo.assets.webp && <source srcSet={photo.assets.webp} type="image/webp" sizes={sizes} />}
        {/* eslint-disable-next-line @next/next/no-img-element -- storage-served derivatives, see note above */}
        <img
          src={photo.assets.webp || photo.assets.original}
          alt={alt ?? photo.title}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      </picture>
    </div>
  );
}
