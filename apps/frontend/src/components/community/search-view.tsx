'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Empty, Input, Spin, Tabs } from 'antd';
import {
  SearchEntityType,
  type GlobalSearchResult,
  type SearchFacets,
  type SearchHit,
} from '@photography/types';
import { client } from '@/lib/api-client';
import { HitCard } from './hit-card';

const GROUP_LABELS: Record<SearchEntityType, string> = {
  [SearchEntityType.PHOTO]: 'Photos',
  [SearchEntityType.ALBUM]: 'Albums',
  [SearchEntityType.COLLECTION]: 'Collections',
  [SearchEntityType.CATEGORY]: 'Categories',
  [SearchEntityType.TAG]: 'Tags',
};

export function SearchView() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';

  const [global, setGlobal] = useState<GlobalSearchResult | null>(null);
  const [photoHits, setPhotoHits] = useState<SearchHit[]>([]);
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [filters, setFilters] = useState<{ camera?: string; lens?: string; tag?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client
      .searchFacets()
      .then(setFacets)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (q.length < 2) return;
    setLoading(true);
    client
      .search(q)
      .then(setGlobal)
      .catch(() => setGlobal(null))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    const p = new URLSearchParams({ limit: '30' });
    if (q) p.set('q', q);
    if (filters.camera) p.set('camera', filters.camera);
    if (filters.lens) p.set('lens', filters.lens);
    if (filters.tag) p.set('tag', filters.tag);
    client
      .searchPhotos(`?${p.toString()}`)
      .then((r) => setPhotoHits(r.items))
      .catch(() => setPhotoHits([]));
  }, [q, filters]);

  const groups = global?.groups;

  return (
    <section className="mx-auto max-w-wide px-5 pt-28 pb-20">
      <h1 className="font-display text-display-lg font-semibold tracking-tight">
        {q ? <>Results for “{q}”</> : 'Search'}
      </h1>

      <Tabs
        className="mt-6"
        items={[
          {
            key: 'all',
            label: 'Everything',
            children: loading ? (
              <div className="flex justify-center py-16">
                <Spin />
              </div>
            ) : !global || global.total === 0 ? (
              <Empty
                description={q.length < 2 ? 'Type at least 2 characters' : 'No matches'}
                className="py-16"
              />
            ) : (
              <div className="space-y-10">
                {(Object.keys(GROUP_LABELS) as SearchEntityType[])
                  .filter((t) => groups && groups[t].length > 0)
                  .map((t) => (
                    <div key={t}>
                      <h2 className="font-display mb-3 text-tagline font-semibold">
                        {GROUP_LABELS[t]}
                      </h2>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {groups![t].map((h) => (
                          <HitCard key={`${t}-${h.id}`} hit={h} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ),
          },
          {
            key: 'photos',
            label: 'Photos (faceted)',
            children: (
              <div>
                <div className="mb-6 flex flex-wrap gap-3">
                  <FacetSelect
                    label="Camera"
                    value={filters.camera}
                    options={facets?.cameras}
                    onChange={(v) => setFilters((f) => ({ ...f, camera: v }))}
                  />
                  <FacetSelect
                    label="Lens"
                    value={filters.lens}
                    options={facets?.lenses}
                    onChange={(v) => setFilters((f) => ({ ...f, lens: v }))}
                  />
                </div>
                {photoHits.length === 0 ? (
                  <Empty description="No photos match" className="py-16" />
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {photoHits.map((h) => (
                      <HitCard key={h.id} hit={h} />
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}

function FacetSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options?: Array<{ value: string; count: number }>;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Input.Group compact>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm dark:border-white/10 dark:bg-tile-2"
      >
        <option value="">{label}: any</option>
        {(options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.value} ({o.count})
          </option>
        ))}
      </select>
    </Input.Group>
  );
}
