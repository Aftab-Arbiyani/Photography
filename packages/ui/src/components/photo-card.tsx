'use client';

import type { PublicPhoto } from '@photography/types';
import { cn } from '../cn';
import { justifiedItemStyle, justifiedRatio } from './justified-grid';
import { ResponsiveImage } from './responsive-image';

interface PhotoCardProps {
  photo: PublicPhoto;
  onOpen?: (photo: PublicPhoto) => void;
  onToggleLike?: (photo: PublicPhoto) => void;
  onToggleBookmark?: (photo: PublicPhoto) => void;
  priority?: boolean;
  /**
   * Target row height when placed in a JustifiedGrid. Omit for a block tile
   * that flows inside MasonryGrid instead.
   */
  rowHeight?: number;
  /** Render the tile as a link to this URL instead of a button. */
  href?: string;
}

const HeartIcon = ({ filled, size = 18 }: { filled?: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
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

const CommentIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const compact = (n: number) =>
  n < 1000
    ? String(n)
    : n < 1_000_000
      ? `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
      : `${(n / 1_000_000).toFixed(1)}m`;

/**
 * Gallery tile. Click opens the photo; on hover a scrim reveals the title and
 * fave/comment counts, with like and save controls in the corner (they stop
 * propagation). Sizes itself for JustifiedGrid when `rowHeight` is given,
 * otherwise renders as a `break-inside-avoid` block for MasonryGrid.
 */
export function PhotoCard({
  photo,
  onOpen,
  onToggleLike,
  onToggleBookmark,
  priority,
  rowHeight,
  href,
}: PhotoCardProps) {
  const justified = rowHeight !== undefined;
  // In a justified row the box takes the clamped ratio and the image crops to it,
  // so every tile in the row lines up at the same height.
  const boxWidth = justified
    ? Math.round(justifiedRatio(photo.width, photo.height) * 1000)
    : photo.width;
  const boxHeight = justified ? 1000 : photo.height;

  const image = (
    <ResponsiveImage
      assets={photo.assets}
      alt={photo.title}
      width={boxWidth}
      height={boxHeight}
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
      className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
    />
  );

  return (
    <figure
      className={cn(
        'group relative overflow-hidden rounded-lg bg-black/20',
        !justified && 'mb-2 break-inside-avoid',
      )}
      style={justified ? justifiedItemStyle(photo.width, photo.height, rowHeight) : undefined}
    >
      {href ? (
        // A real link so tiles are crawlable and open in a new tab; plain
        // left-clicks still go through `onOpen` (e.g. client-side routing).
        <a
          href={href}
          onClick={(e) => {
            if (!onOpen || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
              return;
            }
            e.preventDefault();
            onOpen(photo);
          }}
          className="block w-full"
          aria-label={photo.title}
        >
          {image}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => onOpen?.(photo)}
          className="block w-full"
          aria-label={`Open ${photo.title}`}
        >
          {image}
        </button>
      )}

      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-2.5 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="line-clamp-1 text-sm font-semibold text-white">{photo.title}</p>
        <span className="flex shrink-0 items-center gap-2.5 text-xs font-medium text-white/85">
          <span className="flex items-center gap-1">
            <HeartIcon filled size={13} />
            {compact(photo.likesCount)}
          </span>
          <span className="flex items-center gap-1">
            <CommentIcon />
            {compact(photo.commentsCount)}
          </span>
        </span>
      </figcaption>

      {/* Always shown on touch screens, where there is no hover to reveal them. */}
      <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        {onToggleLike && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(photo);
            }}
            aria-pressed={photo.likedByMe ?? false}
            aria-label={photo.likedByMe ? 'Remove from faves' : 'Fave'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition active:scale-90',
              photo.likedByMe
                ? 'bg-[#ff7a45] text-[#0e1012]'
                : 'bg-black/45 text-white hover:bg-black/65',
            )}
          >
            <HeartIcon filled={photo.likedByMe} size={16} />
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
            aria-label={photo.bookmarkedByMe ? 'Remove from collection' : 'Save to collection'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition active:scale-90',
              photo.bookmarkedByMe
                ? 'bg-white text-[#0e1012]'
                : 'bg-black/45 text-white hover:bg-black/65',
            )}
          >
            <BookmarkIcon filled={photo.bookmarkedByMe} />
          </button>
        )}
      </div>
    </figure>
  );
}
