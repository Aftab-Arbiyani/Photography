'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicPhoto } from '@photography/types';
import { JustifiedGrid, PhotoCard } from '@photography/ui';
import { useEngagement } from './use-engagement';

interface PhotoGridProps {
  photos: PublicPhoto[];
  /** Target row height in px. */
  rowHeight?: number;
  /** How many leading images load eagerly. */
  priorityCount?: number;
}

/**
 * Static justified grid for server-rendered pages: each tile links to its photo
 * page (client-side navigation on a plain click); fave/save work in place.
 */
export function PhotoGrid({ photos: initial, rowHeight = 240, priorityCount = 0 }: PhotoGridProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [source, setSource] = useState(initial);
  const { toggleLike, toggleBookmark } = useEngagement(setPhotos);

  // Adopt a new list from the parent during render (not in an effect), so there
  // is no stale frame and no extra post-paint render.
  if (source !== initial) {
    setSource(initial);
    setPhotos(initial);
  }

  return (
    <JustifiedGrid>
      {photos.map((photo, i) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          rowHeight={rowHeight}
          priority={i < priorityCount}
          href={`/photos/${photo.slug}`}
          onOpen={(p) => router.push(`/photos/${p.slug}`)}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
        />
      ))}
    </JustifiedGrid>
  );
}
