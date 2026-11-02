'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { App, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { PublicCategory, PublicPhoto } from '@photography/types';
import { JustifiedGrid, PhotoCard, Lightbox, cn } from '@photography/ui';
import { client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { useEngagement } from './use-engagement';

interface GalleryClientProps {
  categories?: PublicCategory[];
  initial: { items: PublicPhoto[]; nextCursor: string | null; hasMore: boolean };
  /** When set, the grid is locked to one album and the filter bar is hidden. */
  albumId?: string;
  /** Pre-selected filter chip, from the `?category=` deep-link. */
  initialCategoryId?: string | null;
  showHeader?: boolean;
}

const PAGE_LIMIT = 24;

export function GalleryClient({
  categories = [],
  initial,
  albumId,
  initialCategoryId = null,
  showHeader = true,
}: GalleryClientProps) {
  const { message } = App.useApp();

  const [photos, setPhotos] = useState<PublicPhoto[]>(initial.items);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { toggleLike, toggleBookmark } = useEngagement(setPhotos);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Identifies the active filter set so stale responses can be discarded.
  const queryRef = useRef(0);
  // Filters the current `photos` were loaded for — the server already rendered
  // page 1 for the initial ones. Compared by value so StrictMode's double effect
  // run doesn't refetch.
  const loadedFor = useRef(`${initialCategoryId ?? ''}|`);
  const { isAuthenticated } = useAuth();

  const buildQs = useCallback(
    (nextCursor: string | null) => {
      const p = new URLSearchParams();
      p.set('limit', String(PAGE_LIMIT));
      if (nextCursor) p.set('cursor', nextCursor);
      if (albumId) p.set('albumId', albumId);
      if (categoryId) p.set('categoryId', categoryId);
      if (search.trim()) p.set('search', search.trim());
      return `?${p.toString()}`;
    },
    [albumId, categoryId, search],
  );

  const load = useCallback(
    async (reset: boolean) => {
      const token = ++queryRef.current;
      setLoading(true);
      try {
        const page = await client.gallery(buildQs(reset ? null : cursor));
        if (queryRef.current !== token) return; // stale
        setPhotos((prev) => (reset ? page.items : [...prev, ...page.items]));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch {
        message.error('Could not load photos.');
      } finally {
        if (queryRef.current === token) setLoading(false);
      }
    },
    [buildQs, cursor, message],
  );

  // Reload from scratch when filters change.
  useEffect(() => {
    const key = `${categoryId ?? ''}|${search.trim()}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, search]);

  // The server render is anonymous, so it can't know what this viewer has faved
  // or saved. Once signed in, reload page 1 with auth to pick up those flags.
  useEffect(() => {
    if (isAuthenticated) void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Infinite-scroll sentinel.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) void load(false);
      },
      { rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, load]);

  const showFilters = !albumId;

  return (
    <section className={cn('mx-auto max-w-wide px-4 pb-20 sm:px-5', showHeader ? 'pt-8' : 'pt-4')}>
      {showHeader && (
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-display-lg font-bold tracking-tight">Discover</h1>
            <p className="mt-1 text-ink-muted">
              Every photo in the gallery. Fave the ones you love, buy the full-res sets in the shop.
            </p>
          </div>
          {showFilters && (
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(draft);
              }}
              className="md:w-80"
            >
              <label className="flex items-center gap-2 rounded-pill border border-hairline bg-ink/5 px-4 py-2 focus-within:border-primary">
                <SearchOutlined className="!text-ink-muted" />
                <input
                  type="search"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (!e.target.value) setSearch('');
                  }}
                  placeholder="Search the gallery…"
                  aria-label="Search the gallery"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
                />
              </label>
            </form>
          )}
        </header>
      )}

      {showFilters && categories.length > 0 && (
        <div
          role="group"
          aria-label="Filter by category"
          className="no-scrollbar sticky top-14 z-20 -mx-4 mb-5 flex gap-2 overflow-x-auto border-b border-hairline bg-background/90 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5"
        >
          <FilterChip active={categoryId === null} onClick={() => setCategoryId(null)}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>
      )}

      {photos.length === 0 && !loading ? (
        <Empty description="Nothing here yet" className="py-20" />
      ) : (
        <JustifiedGrid>
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              rowHeight={250}
              priority={i < 6}
              href={`/photos/${photo.slug}`}
              onOpen={() => setLightboxIndex(i)}
              onToggleLike={toggleLike}
              onToggleBookmark={toggleBookmark}
            />
          ))}
        </JustifiedGrid>
      )}

      <div ref={sentinelRef} className="flex justify-center py-10">
        {loading && <Spin />}
        {!hasMore && photos.length > 0 && (
          <p className="text-sm text-ink-muted">That’s everything — check back for new drops.</p>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-pill border px-4 py-1.5 text-sm font-semibold transition active:scale-95',
        active
          ? 'border-primary bg-primary text-ink-fixed'
          : 'border-hairline text-ink-muted hover:border-ink/40 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
