'use client';

import { useEffect, useState } from 'react';
import type { MarketplaceAlbum } from '@photography/types';
import { client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { AlbumCard } from './album-card';

/** Per-user "Recently viewed" rail (Redis-backed). Renders nothing when empty. */
export function RecentlyViewedRail() {
  const { isAuthenticated } = useAuth();
  const [albums, setAlbums] = useState<MarketplaceAlbum[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    client
      .recentlyViewed()
      .then(setAlbums)
      .catch(() => setAlbums([]));
  }, [isAuthenticated]);

  if (!isAuthenticated || albums.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="font-display mb-4 text-tagline font-semibold">Recently viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {albums.map((a) => (
          <div key={a.id} className="w-64 shrink-0">
            <AlbumCard album={a} />
          </div>
        ))}
      </div>
    </section>
  );
}
