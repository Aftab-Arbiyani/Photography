import type { PublicPhoto } from '@photography/types';
import { PhotoMarquee } from '@/components/landing/photo-marquee';
import { SectionHeading } from '@/components/landing/section-heading';

interface LatestRailProps {
  photos: PublicPhoto[];
}

/**
 * Full-bleed contact sheet on a dark surface — two counter-travelling rails so
 * the eye keeps moving. Deliberately edge-to-edge: it should feel like film
 * running past, not a boxed widget.
 */
export function LatestRail({ photos }: LatestRailProps) {
  const half = Math.ceil(photos.length / 2);
  const top = photos.slice(0, half);
  const bottom = photos.slice(half);

  return (
    <section className="overflow-hidden bg-tile-1 py-section lg:py-section-lg text-white">
      <div className="mx-auto mb-12 max-w-wide px-5">
        <SectionHeading
          onDark
          eyebrow="Latest"
          title="Fresh from the field."
          body="Every frame published to the platform, newest first — with the camera settings that made it."
          ctaHref="/gallery"
          ctaLabel="Browse everything"
        />
      </div>

      <div className="space-y-4">
        <PhotoMarquee photos={top} />
        <PhotoMarquee photos={bottom.length ? bottom : top} reverse />
      </div>
    </section>
  );
}
