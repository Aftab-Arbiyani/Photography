import Link from 'next/link';
import type { PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/section-heading';
import { captureLine, compactCount } from '@/lib/photo-meta';

interface FeaturedMosaicProps {
  photos: PublicPhoto[];
}

/**
 * Editorial composition: one tall lead frame, two halves beside it, three thirds
 * underneath. Heights come from the grid's auto-rows, so tiles always align.
 */
const SLOTS = [
  { span: 'row-span-2 sm:col-span-2 lg:col-span-7', sizes: '(max-width: 1024px) 100vw, 58vw' },
  { span: 'lg:col-span-5', sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw' },
  { span: 'lg:col-span-5', sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw' },
  { span: 'lg:col-span-4', sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' },
  { span: 'lg:col-span-4', sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' },
  { span: 'sm:col-span-2 lg:col-span-4', sizes: '(max-width: 1024px) 100vw, 33vw' },
] as const;

function MosaicTile({
  photo,
  index,
  large,
}: {
  photo: PublicPhoto | null;
  index: number;
  large?: boolean;
}) {
  const slot = SLOTS[index];
  const shell = `group relative overflow-hidden rounded-card bg-tile-1 ${slot.span}`;

  const surface = (
    <>
      <PhotoFrame
        photo={photo}
        seed={`mosaic-${index}`}
        sizes={slot.sizes}
        imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
        className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
      />
      {photo && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent"
          />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h3
              className={`font-display font-semibold tracking-tight text-white ${
                large ? 'text-2xl sm:text-[32px]' : 'text-lg'
              }`}
            >
              {photo.title}
            </h3>
            <p className="mt-1.5 line-clamp-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {captureLine(photo) ?? 'Original frame'}
            </p>
            <p className="mt-3 flex items-center gap-4 text-xs text-white/70 transition-opacity duration-500 sm:opacity-0 sm:group-hover:opacity-100">
              <span>♥ {compactCount(photo.likesCount)}</span>
              <span>◎ {compactCount(photo.viewsCount)}</span>
              <span className="ml-auto font-medium text-white">View frame →</span>
            </p>
          </figcaption>
        </>
      )}
    </>
  );

  if (!photo) {
    return (
      <div aria-hidden className={shell}>
        {surface}
      </div>
    );
  }

  return (
    <Link href={`/photos/${photo.slug}`} className={shell} aria-label={photo.title}>
      <figure className="contents">{surface}</figure>
    </Link>
  );
}

/**
 * The featured wall — the frames the studio is leading with. Slots without a
 * published photo hold the composition with placeholder plates.
 */
export function FeaturedMosaic({ photos }: FeaturedMosaicProps) {
  const tiles: Array<PublicPhoto | null> = SLOTS.map((_, i) => photos[i] ?? null);

  return (
    <section className="bg-canvas px-5 py-section lg:py-section-lg dark:bg-tile-2">
      <div className="mx-auto max-w-wide">
        <SectionHeading
          eyebrow="Featured"
          title="The wall this month."
          body="Frames chosen for light, timing and restraint — the ones worth standing in front of."
          ctaHref="/gallery"
          ctaLabel="See all photographs"
        />

        <Reveal className="mt-12 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 sm:auto-rows-[240px] lg:grid-cols-12 lg:auto-rows-[260px]">
          {tiles.map((photo, i) => (
            <MosaicTile key={photo?.id ?? `slot-${i}`} photo={photo} index={i} large={i === 0} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
