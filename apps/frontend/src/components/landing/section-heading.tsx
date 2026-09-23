import Link from 'next/link';
import { Reveal } from '@/components/landing/reveal';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
  /** Light type for sections that sit on a dark surface. */
  onDark?: boolean;
}

/**
 * Left-aligned editorial section header: rule + eyebrow, display title, lead
 * paragraph, and an optional inline link parked on the right at desktop width.
 */
export function SectionHeading({
  eyebrow,
  title,
  body,
  ctaHref,
  ctaLabel,
  onDark = false,
}: SectionHeadingProps) {
  return (
    <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p
          className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] ${
            onDark ? 'text-white/60' : 'text-ink-muted'
          }`}
        >
          <span className={`h-px w-8 ${onDark ? 'bg-primary-on-dark' : 'bg-primary'}`} />
          {eyebrow}
        </p>
        <h2
          className={`font-display mt-4 text-[clamp(28px,4.2vw,46px)] font-semibold leading-[1.06] tracking-[-0.02em] ${
            onDark ? 'text-white' : ''
          }`}
        >
          {title}
        </h2>
        {body && (
          <p
            className={`mt-4 text-lg leading-relaxed ${onDark ? 'text-white/65' : 'text-ink-muted'}`}
          >
            {body}
          </p>
        )}
      </div>

      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className={`group inline-flex shrink-0 items-center gap-2 text-[15px] font-medium transition ${
            onDark
              ? 'text-white hover:text-primary-on-dark'
              : 'text-primary hover:text-primary-focus'
          }`}
        >
          {ctaLabel}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      )}
    </Reveal>
  );
}
