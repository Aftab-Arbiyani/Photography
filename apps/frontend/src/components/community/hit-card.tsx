'use client';

import Link from 'next/link';
import { SearchEntityType, type SearchHit } from '@photography/types';

export function hitHref(hit: SearchHit): string {
  switch (hit.type) {
    case SearchEntityType.PHOTO:
      return `/photos/${hit.slug}`;
    case SearchEntityType.ALBUM:
      return `/albums/${hit.slug}`;
    case SearchEntityType.COLLECTION:
      return `/collections/${hit.slug}`;
    case SearchEntityType.TAG:
      return `/search?q=${encodeURIComponent(hit.title)}`;
    case SearchEntityType.CATEGORY:
    default:
      return '/gallery';
  }
}

/** Visual tile for any search/discovery hit. Uses the resolved thumbnail when present. */
export function HitCard({ hit }: { hit: SearchHit }) {
  return (
    <Link
      href={hitHref(hit)}
      className="group block overflow-hidden rounded-card border border-hairline/60 dark:border-white/10"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-[#11243f] to-[#050608]">
        {hit.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hit.imageUrl}
            alt={hit.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="px-4 text-center font-display text-base font-semibold text-white/90">
            {hit.title}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-medium">{hit.title}</p>
        {hit.subtitle && <p className="line-clamp-1 text-xs text-ink-muted">{hit.subtitle}</p>}
      </div>
    </Link>
  );
}
