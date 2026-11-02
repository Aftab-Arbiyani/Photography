'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';
import { captureLine } from '@/lib/photo-meta';

interface HeroProps {
  /** Featured frames for the backdrop. Empty is fine — plates stand in. */
  photos: PublicPhoto[];
}

const SLIDE_MS = 6500;
const MAX_SLIDES = 5;

/**
 * Full-bleed photographic stage: a slow cross-fading, Ken-Burns-drifting reel of
 * featured frames behind bottom-anchored editorial type.
 *
 * The entrance is CSS (not JS) animation on purpose — the headline must be in
 * the server-rendered HTML at full opacity for crawlers and for anyone whose
 * JavaScript is slow or blocked.
 */
export function Hero({ photos }: HeroProps) {
  const slides: Array<PublicPhoto | null> = photos.length
    ? photos.slice(0, MAX_SLIDES)
    : [null, null, null];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const current = slides[active] ?? null;
  const capture = captureLine(current);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-tile-1 text-white">
      {/* Reel */}
      {slides.map((photo, i) => (
        <div
          key={photo?.id ?? `plate-${i}`}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <PhotoFrame
            photo={photo}
            seed={`hero-${i}`}
            grain
            // Blue hour → desert amber → dusk plum: a deliberate reel, not a shuffle.
            palette={[0, 3, 1][i % 3]}
            priority={i === 0}
            sizes="100vw"
            imgClassName={i === active ? 'animate-ken-burns' : 'scale-[1.06]'}
            className={i === active ? 'animate-ken-burns' : undefined}
          />
        </div>
      ))}

      {/* Legibility scrims: vertical for the type, corner wash for depth */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(115%_75%_at_10%_100%,rgba(0,0,0,0.7),transparent_62%)]"
      />
      <div aria-hidden className="film-grain absolute inset-0" />

      {/* Editorial block, bottom-left */}
      <div className="relative z-10 mx-auto w-full max-w-wide px-5 pb-16 pt-32 sm:pb-20">
        <p className="animate-rise flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/85">
          <span className="h-px w-10 bg-primary-on-dark" />
          Photography, framed.
        </p>

        <h1
          style={{ animationDelay: '80ms' }}
          className="font-display animate-rise mt-5 max-w-4xl text-[clamp(40px,8vw,92px)] font-semibold leading-[0.98] tracking-[-0.03em] [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]"
        >
          Light, story and craft.
          <span className="block text-white/75">In one frame.</span>
        </h1>

        <p
          style={{ animationDelay: '160ms' }}
          className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl"
        >
          A gallery for the work — and the stories behind every photograph.
        </p>

        <div
          style={{ animationDelay: '240ms' }}
          className="animate-rise mt-9 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/gallery"
            className="rounded-pill bg-white px-7 py-3.5 text-[15px] font-medium text-ink-fixed transition hover:bg-white/90 active:scale-95"
          >
            Explore the gallery
          </Link>
          <Link
            href="/collections"
            className="rounded-pill border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-medium text-white backdrop-blur transition hover:border-white/70 hover:bg-white/20 active:scale-95"
          >
            View collections
          </Link>
        </div>

        {/* Frame index + capture credit — the gallery-wall detail */}
        <div
          style={{ animationDelay: '320ms' }}
          className="animate-rise mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-white/15 pt-5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white/90">
              {current?.title ?? 'Your featured frames appear here'}
            </p>
            <p className="mt-1 truncate text-xs tracking-wide text-white/75">
              {capture ?? 'Publish a photograph and it takes the stage automatically.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {slides.map((photo, i) => (
                <button
                  key={photo?.id ?? `dot-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show frame ${i + 1}`}
                  aria-current={i === active}
                  className={`h-1 rounded-pill transition-all duration-500 ${
                    i === active ? 'w-10 bg-white' : 'w-4 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
            <span className="font-display text-xs tabular-nums tracking-[0.2em] text-white/75">
              {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
