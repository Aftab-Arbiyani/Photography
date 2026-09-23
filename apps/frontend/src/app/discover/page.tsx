'use client';

import { useEffect, useState } from 'react';
import { Empty, Spin } from 'antd';
import type { SearchHit } from '@photography/types';
import { client } from '@/lib/api-client';
import { HitCard } from '@/components/community/hit-card';

function Section({ title, hits, loading }: { title: string; hits: SearchHit[]; loading: boolean }) {
  return (
    <section className="mb-12">
      <h2 className="font-display mb-4 text-tagline font-semibold">{title}</h2>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : hits.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing here yet" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {hits.map((h) => (
            <HitCard key={`${h.type}-${h.id}`} hit={h} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DiscoverPage() {
  const [trending, setTrending] = useState<SearchHit[]>([]);
  const [albums, setAlbums] = useState<SearchHit[]>([]);
  const [collections, setCollections] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client
        .trendingPhotos()
        .then((r) => setTrending(r.items))
        .catch(() => undefined),
      client
        .popularAlbums()
        .then((r) => setAlbums(r.items))
        .catch(() => undefined),
      client
        .featuredCollections()
        .then((r) => setCollections(r.items))
        .catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-wide px-5 pt-28 pb-20">
      <header className="mb-10">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Discover</h1>
        <p className="mt-2 text-ink-muted">
          Trending photos, popular albums and featured collections.
        </p>
      </header>
      <Section title="Trending photos" hits={trending} loading={loading} />
      <Section title="Popular albums" hits={albums} loading={loading} />
      <Section title="Featured collections" hits={collections} loading={loading} />
    </section>
  );
}
