import { JustifiedGrid, justifiedItemStyle } from '@photography/ui';
import { PhotoFrame } from '@/components/media/photo-frame';

// A believable mix of landscape, portrait and square frames.
const RATIOS: Array<[number, number]> = [
  [3, 2],
  [2, 3],
  [4, 3],
  [1, 1],
  [3, 4],
  [16, 9],
  [4, 5],
  [3, 2],
  [2, 3],
  [5, 4],
  [16, 10],
  [3, 4],
];

/**
 * Justified grid of generated plates, shown while no photos are published so
 * the page keeps its shape instead of collapsing to empty sections.
 */
export function PlaceholderGrid({
  count = 12,
  rowHeight = 240,
  seed,
}: {
  count?: number;
  rowHeight?: number;
  seed: string;
}) {
  return (
    <JustifiedGrid>
      {Array.from({ length: count }, (_, i) => {
        const [w, h] = RATIOS[i % RATIOS.length];
        return (
          <div
            key={i}
            aria-hidden
            className="relative overflow-hidden rounded-lg"
            style={{ ...justifiedItemStyle(w, h, rowHeight), aspectRatio: `${w} / ${h}` }}
          >
            <PhotoFrame seed={`${seed}-${i}`} sizes="30vw" />
          </div>
        );
      })}
    </JustifiedGrid>
  );
}
