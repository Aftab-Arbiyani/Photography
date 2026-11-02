'use client';

import { useEffect, useState } from 'react';
import { Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { MarketplaceAlbum } from '@photography/types';
import { cn } from '@photography/ui';
import { client } from '@/lib/api-client';
import { AlbumCard } from '@/components/store/album-card';
import { RecentlyViewedRail } from '@/components/store/recently-viewed-rail';

type Sort = 'newest' | 'rating' | 'sales';

const SORTS: ReadonlyArray<{ value: Sort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'sales', label: 'Best selling' },
];

export default function StorePage() {
  const [albums, setAlbums] = useState<MarketplaceAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<Sort>('newest');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Drop responses for a sort/search the user has already moved past.
    let current = true;
    const params = new URLSearchParams({ limit: '24', sort });
    if (search.trim()) params.set('search', search.trim());
    setLoading(true);
    setFailed(false);
    client
      .marketplaceAlbums(`?${params.toString()}`)
      .then((r) => {
        if (current) setAlbums(r.items);
      })
      .catch(() => {
        if (!current) return;
        setAlbums([]);
        setFailed(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [sort, search, attempt]);

  return (
    <section className="mx-auto max-w-wide px-4 pt-8 pb-20 sm:px-5">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-display-lg font-bold tracking-tight">Shop</h1>
          <p className="mt-1 text-ink-muted">High-res sets and downloads by the creator.</p>
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(draft);
          }}
          className="md:w-80"
        >
          <label className="flex items-center gap-2 rounded-pill border border-hairline bg-ink/5 px-4 py-2 focus-within:border-primary">
            <SearchOutlined aria-hidden className="!text-ink-muted" />
            <input
              type="search"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (!e.target.value) setSearch('');
              }}
              placeholder="Search sets…"
              aria-label="Search sets"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
            />
          </label>
        </form>
      </header>

      <RecentlyViewedRail />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-tagline font-bold tracking-tight">All sets</h2>
        <div role="group" aria-label="Sort sets" className="flex flex-wrap gap-2">
          {SORTS.map((option) => {
            const active = sort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setSort(option.value)}
                className={cn(
                  'whitespace-nowrap rounded-pill border px-4 py-1.5 text-sm font-semibold transition active:scale-95',
                  active
                    ? 'border-primary bg-primary text-ink-fixed'
                    : 'border-hairline text-ink-muted hover:border-ink/40 hover:text-ink',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : failed ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-ink-muted">The shop couldn’t be loaded just now.</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-pill border border-hairline px-4 py-1.5 text-sm font-semibold text-ink transition hover:border-ink/40"
          >
            Try again
          </button>
        </div>
      ) : albums.length === 0 ? (
        <Empty
          description={search.trim() ? `No sets match “${search.trim()}”` : 'No sets for sale yet'}
          className="py-20"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </div>
      )}
    </section>
  );
}
