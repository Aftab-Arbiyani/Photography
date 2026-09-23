'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Empty, Spin } from 'antd';
import { MasonryGrid, ResponsiveImage } from '@photography/ui';
import type { PublicPhoto } from '@photography/types';
import { client } from '@/lib/api-client';

export default function BookmarksPage() {
  const [photos, setPhotos] = useState<PublicPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .myBookmarks(1)
      .then((r) => setPhotos(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Bookmarks</h1>
      <p className="mt-2 mb-6 text-ink-muted">Photos you’ve saved.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : photos.length === 0 ? (
        <Empty description="No bookmarks yet" className="py-16" />
      ) : (
        <MasonryGrid>
          {photos.map((p) => (
            <Link
              key={p.id}
              href={`/photos/${p.slug}`}
              className="mb-4 block break-inside-avoid overflow-hidden rounded-card"
            >
              <ResponsiveImage assets={p.assets} alt={p.title} width={p.width} height={p.height} />
            </Link>
          ))}
        </MasonryGrid>
      )}
    </div>
  );
}
