import Link from 'next/link';
import type { PublicCollection, PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/section-heading';

export interface ShowcaseEntry {
  collection: PublicCollection;
  /** First photo of the collection, used as the cover. */
  cover: PublicPhoto | null;
}

interface CollectionShowcaseProps {
  entries: ShowcaseEntry[];
}

/** Copy for the empty state — three curated themes the studio ships with. */
const PLACEHOLDER_CARDS = [
  {
    title: 'Curated series',
    body: 'Group frames that belong together and publish them as one story.',
  },
  {
    title: 'Themed editions',
    body: 'Cross albums and photographers to build a single point of view.',
  },
  { title: 'Seasonal drops', body: 'Release a set on a date and let members in first.' },
] as const;

/**
 * Cover-led collection cards. Falls back to descriptive plates when nothing is
 * published yet, so the row still reads as part of the design.
 */
export function CollectionShowcase({ entries }: CollectionShowcaseProps) {
  const hasEntries = entries.length > 0;

  return (
    <section className="bg-parchment px-5 py-section lg:py-section-lg dark:bg-tile-3">
      <div className="mx-auto max-w-wide">
        <SectionHeading
          eyebrow="Collections"
          title="Curated, with intent."
          body="Hand-picked groupings that cross albums and themes — the editor's eye, made browsable."
          ctaHref="/collections"
          ctaLabel="Browse collections"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {hasEntries
            ? entries.slice(0, 3).map(({ collection, cover }, i) => (
                <Reveal key={collection.id} index={i}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="group relative block h-[420px] overflow-hidden rounded-card bg-tile-1"
                  >
                    <PhotoFrame
                      photo={cover}
                      seed={`collection-${collection.slug}`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      imgClassName="transition-transform duration-[1000ms] ease-out group-hover:scale-[1.06]"
                      className="transition-transform duration-[1000ms] ease-out group-hover:scale-[1.06]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">
                        {collection.photosCount} {collection.photosCount === 1 ? 'frame' : 'frames'}
                      </p>
                      <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-white">
                        {collection.title}
                      </h3>
                      {collection.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-white/80">
                          {collection.description}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white">
                        Open collection
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))
            : PLACEHOLDER_CARDS.map((card, i) => (
                <Reveal key={card.title} index={i}>
                  <div className="relative h-[420px] overflow-hidden rounded-card bg-tile-1">
                    <PhotoFrame
                      seed={`collection-placeholder-${i}`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm text-white/80">{card.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
