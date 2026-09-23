import Link from 'next/link';
import type { PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';

interface PhotoMarqueeProps {
  photos: PublicPhoto[];
  /** Reverse the travel direction — used to make two stacked rails counter-scroll. */
  reverse?: boolean;
}

const MIN_TILES = 8;

/**
 * Continuously travelling contact sheet. The track holds the frames twice so the
 * loop is seamless; hovering pauses it and `prefers-reduced-motion` stops it
 * outright, leaving a normally scrollable strip.
 */
export function PhotoMarquee({ photos, reverse = false }: PhotoMarqueeProps) {
  const source: Array<PublicPhoto | null> = photos.length
    ? photos
    : Array.from({ length: MIN_TILES }, () => null);
  const tiles = source.length >= MIN_TILES ? source : [...source, ...source].slice(0, MIN_TILES);
  const track = [...tiles, ...tiles];

  return (
    <div className="marquee-mask group/rail overflow-hidden motion-reduce:overflow-x-auto">
      <div
        className={`flex w-max gap-4 ${
          reverse ? 'animate-marquee-reverse' : 'animate-marquee'
        } hover:[animation-play-state:paused] motion-reduce:animate-none`}
      >
        {track.map((photo, i) => {
          const key = `${photo?.id ?? 'plate'}-${i}`;
          const seed = `rail-${reverse ? 'b' : 'a'}-${i % tiles.length}`;
          const frame = (
            <>
              <PhotoFrame
                photo={photo}
                seed={seed}
                sizes="320px"
                imgClassName="transition-transform duration-700 group-hover:scale-105"
              />
              {photo && (
                <>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <p className="absolute inset-x-0 bottom-0 truncate p-4 text-sm font-medium text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    {photo.title}
                  </p>
                </>
              )}
            </>
          );

          const shell =
            'group relative h-[220px] w-[300px] shrink-0 overflow-hidden rounded-card bg-tile-1 sm:h-[260px] sm:w-[360px]';

          return photo ? (
            <Link
              key={key}
              href={`/photos/${photo.slug}`}
              className={shell}
              aria-label={photo.title}
              tabIndex={i < tiles.length ? 0 : -1}
              aria-hidden={i >= tiles.length}
            >
              {frame}
            </Link>
          ) : (
            <div key={key} aria-hidden className={shell}>
              {frame}
            </div>
          );
        })}
      </div>
    </div>
  );
}
