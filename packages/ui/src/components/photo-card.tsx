'use client';

import type { PublicPhoto } from '@photography/types';
import { cn } from '../cn';
import { ResponsiveImage } from './responsive-image';

interface PhotoCardProps {
  photo: PublicPhoto;
  onOpen?: (photo: PublicPhoto) => void;
  onToggleLike?: (photo: PublicPhoto) => void;
  onToggleBookmark?: (photo: PublicPhoto) => void;
  priority?: boolean;
}

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

/**
 * Gallery tile. Click opens the lightbox; like/bookmark controls overlay on hover
 * and stop propagation. Designed as a `break-inside-avoid` block for MasonryGrid.
 */
export function PhotoCard({
  photo,
  onOpen,
  onToggleLike,
  onToggleBookmark,
  priority,
}: PhotoCardProps) {
  return (
    <figure className="group relative mb-4 break-inside-avoid overflow-hidden rounded-card">
      <button
        type="button"
        onClick={() => onOpen?.(photo)}
        className="block w-full cursor-zoom-in"
        aria-label={`Open ${photo.title}`}
      >
        <ResponsiveImage
          assets={photo.assets}
          alt={photo.title}
          width={photo.width}
          height={photo.height}
          priority={priority}
          className="rounded-card transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </button>

      {/* gradient + meta overlay */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="line-clamp-1 text-sm font-medium text-white">{photo.title}</p>
      </figcaption>

      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {onToggleLike && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(photo);
            }}
            aria-pressed={photo.likedByMe ?? false}
            aria-label={photo.likedByMe ? 'Unlike' : 'Like'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition active:scale-90',
              photo.likedByMe
                ? 'bg-white text-red-500'
                : 'bg-black/40 text-white hover:bg-black/60',
            )}
          >
            <HeartIcon filled={photo.likedByMe} />
          </button>
        )}
        {onToggleBookmark && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(photo);
            }}
            aria-pressed={photo.bookmarkedByMe ?? false}
            aria-label={photo.bookmarkedByMe ? 'Remove bookmark' : 'Bookmark'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition active:scale-90',
              photo.bookmarkedByMe
                ? 'bg-white text-primary'
                : 'bg-black/40 text-white hover:bg-black/60',
            )}
          >
            <BookmarkIcon filled={photo.bookmarkedByMe} />
          </button>
        )}
      </div>
    </figure>
  );
}
