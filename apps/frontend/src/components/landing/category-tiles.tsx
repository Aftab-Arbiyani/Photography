import Link from 'next/link';
import type { PublicCategory, PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';

export interface CategoryTile {
  category: PublicCategory;
  cover: PublicPhoto | null;
}

/** Browse-by-subject tiles: a cover photo per category, name and count on top. */
export function CategoryTiles({ tiles }: { tiles: CategoryTile[] }) {
  if (!tiles.length) return null;

  return (
    <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {tiles.map(({ category, cover }, i) => (
        <li key={category.id} className="w-[46vw] shrink-0 snap-start sm:w-auto">
          <Link
            href={`/gallery?category=${category.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-xl"
          >
            <PhotoFrame
              photo={cover}
              seed={`category-${category.slug}`}
              palette={i % 6}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
              imgClassName="transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="font-display text-xl font-bold tracking-tight">{category.name}</p>
              {category.photosCount > 0 && (
                <p className="mt-0.5 text-sm text-white/75">
                  {category.photosCount} {category.photosCount === 1 ? 'photo' : 'photos'}
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
