import Link from 'next/link';
import type { PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';
import { Reveal } from '@/components/landing/reveal';
import { captureLine } from '@/lib/photo-meta';

export interface SplitFeatureProps {
  eyebrow: string;
  title: string;
  body: string;
  /** Three short proof points listed under the copy. */
  points?: readonly string[];
  ctaHref: string;
  ctaLabel: string;
  photo?: PublicPhoto | null;
  seed: string;
  /** Put the image on the right instead of the left. */
  flip?: boolean;
  tone?: 'light' | 'parchment' | 'dark';
}

const toneClasses: Record<NonNullable<SplitFeatureProps['tone']>, string> = {
  light: 'bg-canvas text-ink dark:bg-tile-2 dark:text-parchment',
  parchment: 'bg-parchment text-ink dark:bg-tile-3 dark:text-parchment',
  dark: 'bg-tile-1 text-white',
};

/**
 * A photograph and its argument, side by side. Surface colour alternates between
 * panels — that colour change is the section divider (no rules, no shadows).
 */
export function SplitFeature({
  eyebrow,
  title,
  body,
  points,
  ctaHref,
  ctaLabel,
  photo,
  seed,
  flip = false,
  tone = 'light',
}: SplitFeatureProps) {
  const onDark = tone === 'dark';

  return (
    <section className={`${toneClasses[tone]} px-5 py-section lg:py-section-lg`}>
      <div className="mx-auto grid max-w-wide items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image */}
        <Reveal className={flip ? 'lg:order-2' : undefined}>
          <div className="group relative aspect-[4/5] overflow-hidden rounded-card bg-tile-1 sm:aspect-[5/4] lg:aspect-auto lg:h-[560px]">
            <PhotoFrame
              photo={photo}
              seed={seed}
              sizes="(max-width: 1024px) 100vw, 46vw"
              imgClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
              className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
            {photo && (
              <div className="absolute inset-x-4 bottom-4 rounded-[14px] bg-black/45 p-4 backdrop-blur-md">
                <p className="truncate text-sm font-medium text-white">{photo.title}</p>
                <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-white/55">
                  {captureLine(photo) ?? 'Original frame'}
                </p>
              </div>
            )}
          </div>
        </Reveal>

        {/* Copy */}
        <Reveal index={1} className={flip ? 'lg:order-1' : undefined}>
          <p
            className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] ${
              onDark ? 'text-white/60' : 'text-ink-muted'
            }`}
          >
            <span className={`h-px w-8 ${onDark ? 'bg-primary-on-dark' : 'bg-primary'}`} />
            {eyebrow}
          </p>
          <h2 className="font-display mt-4 text-[clamp(28px,4vw,44px)] font-semibold leading-[1.06] tracking-[-0.02em]">
            {title}
          </h2>
          <p
            className={`mt-5 text-lg leading-relaxed ${onDark ? 'text-white/70' : 'text-ink-muted'}`}
          >
            {body}
          </p>

          {points && (
            <ul className="mt-7 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[15px]">
                  <span
                    aria-hidden
                    className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                      onDark ? 'bg-primary-on-dark' : 'bg-primary'
                    }`}
                  />
                  <span className={onDark ? 'text-white/80' : 'text-ink'}>{point}</span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={ctaHref}
            className={`mt-9 inline-flex items-center gap-2 rounded-pill px-6 py-3 text-[15px] font-medium transition active:scale-95 ${
              onDark ? 'bg-white text-ink hover:bg-white/90' : 'bg-ink text-white hover:bg-ink/90'
            }`}
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
