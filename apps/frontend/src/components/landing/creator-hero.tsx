import Link from 'next/link';
import type { PublicPhoto } from '@photography/types';
import { cn } from '@photography/ui';
import { PhotoFrame } from '@/components/media/photo-frame';
import { siteConfig } from '@/lib/config';

interface CreatorHeroProps {
  /** Up to three frames for the fanned print stack. Empty is fine — plates stand in. */
  photos: PublicPhoto[];
}

// Back-to-front: the outer prints tilt away, the centre print sits on top.
const FAN = [
  'left-0 top-10 -rotate-[8deg] group-hover:-translate-x-6 group-hover:-rotate-[11deg]',
  'right-0 top-10 rotate-[8deg] group-hover:translate-x-6 group-hover:rotate-[11deg]',
  'left-1/2 top-0 z-10 -translate-x-1/2 group-hover:-translate-y-2',
];

/**
 * Compact creator banner: who this is and what's for sale on the left, a
 * fanned stack of prints on the right. Pure server markup — the copy is in the
 * HTML at full opacity for crawlers.
 */
export function CreatorHero({ photos }: CreatorHeroProps) {
  const prints = [0, 1, 2].map((i) => photos[i] ?? null);

  return (
    <section className="relative isolate overflow-hidden border-b border-hairline">
      {/* Ember glow, anchored behind the print stack */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_85%_40%,rgba(255,122,69,0.18),transparent_70%)]"
      />
      <div className="mx-auto grid max-w-wide items-center gap-10 px-4 py-12 sm:px-5 md:grid-cols-[1.1fr_1fr] md:py-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-pill border border-hairline px-3 py-1 text-xs font-semibold text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            New sets every week
          </p>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
            Original photography
            <br />
            <span className="text-primary">&amp; model sets.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-ink-muted">
            Browse the full gallery for free. When something stops you scrolling, take home the
            full-resolution set.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/store"
              className="rounded-pill bg-primary px-6 py-3 text-sm font-bold text-ink-fixed transition hover:bg-primary-focus active:scale-95"
            >
              Shop sets
            </Link>
            <Link
              href="/gallery"
              className="rounded-pill border border-hairline px-6 py-3 text-sm font-bold transition hover:border-ink/40 active:scale-95"
            >
              Browse the gallery
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            <li>Full-res downloads</li>
            <li>Personal &amp; commercial licences</li>
            <li>Instant delivery</li>
          </ul>
        </div>

        <Link
          href="/gallery"
          aria-label={`Browse ${siteConfig.name}'s gallery`}
          className="group relative mx-auto hidden h-[400px] w-full max-w-[460px] sm:block"
        >
          {prints.map((photo, i) => (
            <div
              key={photo?.id ?? `print-${i}`}
              className={cn(
                'absolute aspect-[3/4] w-[58%] overflow-hidden rounded-xl border-4 border-white/90 shadow-2xl shadow-black/50 transition-transform duration-500 ease-out dark:border-tile-2',
                FAN[i],
              )}
            >
              <PhotoFrame
                photo={photo}
                seed={`hero-print-${i}`}
                palette={[1, 3, 0][i]}
                priority={i === 2}
                sizes="(max-width: 768px) 60vw, 270px"
              />
            </div>
          ))}
        </Link>
      </div>
    </section>
  );
}
