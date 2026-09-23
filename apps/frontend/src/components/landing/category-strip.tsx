import Link from 'next/link';
import type { PublicCategory, PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/section-heading';

interface CategoryStripProps {
  categories: PublicCategory[];
  /** Pool the covers are drawn from — a photo is only used for its own category. */
  photos: PublicPhoto[];
}

const MAX = 6;

/**
 * Browse-by-subject row. Each tile is covered by a photograph that genuinely
 * belongs to that category (never a borrowed frame) and deep-links into the
 * filtered gallery.
 */
export function CategoryStrip({ categories, photos }: CategoryStripProps) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-canvas px-5 py-section lg:py-section-lg dark:bg-tile-2">
      <div className="mx-auto max-w-wide">
        <SectionHeading
          eyebrow="Subjects"
          title="Find your kind of light."
          body="Landscape to street — jump straight to the work you came for."
          ctaHref="/gallery"
          ctaLabel="Open the full gallery"
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, MAX).map((category, i) => (
            <Reveal key={category.id} index={i % 3}>
              <Link
                href={`/gallery?category=${category.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-tile-1"
              >
                <PhotoFrame
                  photo={photos.find((p) => p.categoryId === category.id) ?? null}
                  seed={`category-${category.slug}`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-base font-semibold tracking-tight text-white">
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-white/75">
                    {category.photosCount} {category.photosCount === 1 ? 'frame' : 'frames'}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
