import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { PublicPhoto } from '@photography/types';
import { cn } from '@photography/ui';
import { PhotoFrame } from '@/components/media/photo-frame';

interface PhotoWallHeroProps {
  /** Frames for the wall. Any number works — few are repeated, none become plates. */
  photos: PublicPhoto[];
  /** Total published photos, for the stat line. Hidden when zero. */
  photoCount: number;
  /** Sets on sale, for the stat line. Hidden when zero. */
  setCount: number;
}

const COLUMNS = 6;
const TILES_PER_COLUMN = 6;
// Alternate drift direction and vary the pace so the wall never moves in lockstep.
const COLUMN_MOTION = [
  { anim: 'animate-wall-up', duration: '95s' },
  { anim: 'animate-wall-down', duration: '120s' },
  { anim: 'animate-wall-up', duration: '105s' },
  { anim: 'animate-wall-down', duration: '88s' },
  { anim: 'animate-wall-up', duration: '115s' },
  { anim: 'animate-wall-down', duration: '100s' },
];
// Narrow screens show fewer, wider columns.
const COLUMN_VISIBILITY = ['', '', '', 'hidden md:block', 'hidden lg:block', 'hidden xl:block'];

type Tile = { key: string; photo: PublicPhoto | null; ratio: number };

/** Portrait-leaning tiles read best in narrow columns; clamp the extremes. */
const tileRatio = (photo: PublicPhoto | null, i: number) =>
  photo
    ? Math.min(Math.max(photo.width / Math.max(photo.height, 1), 0.66), 1.5)
    : [0.75, 1, 0.8, 1.33][i % 4];

/** Deal photos round-robin into columns, offset per column so neighbours differ. */
function buildColumns(photos: PublicPhoto[]): Tile[][] {
  return Array.from({ length: COLUMNS }, (_, c) =>
    Array.from({ length: TILES_PER_COLUMN }, (_, t) => {
      const index = c * TILES_PER_COLUMN + t;
      const photo = photos.length ? photos[(index + c * 3) % photos.length] : null;
      return { key: `${c}-${t}`, photo, ratio: tileRatio(photo, index) };
    }),
  );
}

/**
 * Full-bleed hero made of the work itself: six columns of photographs drifting
 * slowly up and down behind a compact headline card. Pure CSS animation, so it
 * server-renders, and the global reduced-motion rule freezes it in place. The
 * wall is decorative (aria-hidden) — the grids below carry the real links.
 */
export function PhotoWallHero({ photos, photoCount, setCount }: PhotoWallHeroProps) {
  const columns = buildColumns(photos);
  const stats = [
    photoCount > 0 && `${photoCount.toLocaleString('en-US')} photos`,
    setCount > 0 && `${setCount} sets for sale`,
    'Instant full-res downloads',
  ].filter(Boolean);

  return (
    <section className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden bg-tile-3 h-[calc(100svh-3.5rem)] max-h-[920px]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 flex gap-2 px-2 hover:[&_*]:[animation-play-state:paused]"
      >
        {columns.map((tiles, c) => (
          <div key={c} className={cn('min-w-0 flex-1', COLUMN_VISIBILITY[c])}>
            <div
              className={cn('flex flex-col gap-2', COLUMN_MOTION[c].anim)}
              style={{ '--wall-duration': COLUMN_MOTION[c].duration } as CSSProperties}
            >
              {/* Twice through, so translating by -50% loops seamlessly. */}
              {[...tiles, ...tiles].map((tile, i) => (
                <div
                  key={`${tile.key}-${i}`}
                  className="relative w-full overflow-hidden rounded-lg"
                  style={{ aspectRatio: tile.ratio }}
                >
                  <PhotoFrame
                    photo={tile.photo}
                    seed={`wall-${tile.key}`}
                    priority={i < 2}
                    sizes="(max-width: 768px) 34vw, 17vw"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Scrims: darken the centre for the card, fade the edges into the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_50%_50%,rgba(7,8,10,0.78),rgba(7,8,10,0.25)_70%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent"
      />

      <div className="mx-4 max-w-2xl rounded-2xl border border-white/10 bg-black/45 px-6 py-8 text-center text-white shadow-2xl backdrop-blur-md sm:px-10 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          New sets every week
        </p>
        <h1 className="mt-4 font-display text-[36px] font-bold leading-[1.05] tracking-tight sm:text-[54px]">
          Original photography &amp; model sets
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-white/80 sm:text-lg">
          Browse the whole gallery free. Take home the full-resolution set.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/store"
            className="rounded-pill bg-primary px-6 py-3 text-sm font-bold text-ink-fixed transition hover:bg-primary-focus active:scale-95"
          >
            Shop sets
          </Link>
          <Link
            href="/gallery"
            className="rounded-pill border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-white/70 hover:bg-white/10 active:scale-95"
          >
            Explore the gallery
          </Link>
        </div>
        <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-white/70">
          {stats.map((s) => (
            <li key={s as string}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
