'use client';

import { useEffect, useState } from 'react';
import { Empty, Input, Segmented, Spin } from 'antd';
import type { MarketplaceAlbum } from '@photography/types';
import { client } from '@/lib/api-client';
import { AlbumCard } from '@/components/store/album-card';
import { RecentlyViewedRail } from '@/components/store/recently-viewed-rail';

type Sort = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'sales';

export default function StorePage() {
  const [albums, setAlbums] = useState<MarketplaceAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: '24', sort });
    if (search.trim()) params.set('search', search.trim());
    setLoading(true);
    client
      .marketplaceAlbums(`?${params.toString()}`)
      .then((r) => setAlbums(r.items))
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false));
  }, [sort, search]);

  return (
    <section className="mx-auto max-w-wide px-5 pt-28 pb-20">
      <header className="mb-8">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Store</h1>
        <p className="mt-2 text-ink-muted">
          Buy curated albums — high-resolution downloads, licensed for your use.
        </p>
      </header>

      <RecentlyViewedRail />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Segmented
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { label: 'Newest', value: 'newest' },
            { label: 'Top rated', value: 'rating' },
            { label: 'Best selling', value: 'sales' },
          ]}
        />
        <Input.Search
          allowClear
          placeholder="Search albums…"
          className="md:max-w-xs"
          onSearch={setSearch}
          size="large"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : albums.length === 0 ? (
        <Empty description="No albums for sale yet" className="py-20" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </div>
      )}
    </section>
  );
}
