'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Empty, Input, Spin } from 'antd';
import type { PublicCategory, PublicPhoto } from '@photography/types';
import { MasonryGrid, PhotoCard, Lightbox, cn } from '@photography/ui';
import { client, ApiError } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

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
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();

  const [photos, setPhotos] = useState<PublicPhoto[]>(initial.items);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId);
  const [search, setSearch] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Identifies the active filter set so stale responses can be discarded.
  const queryRef = useRef(0);

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
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, search]);

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

  const requireAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      message.info('Sign in to do that.');
      router.push('/login?redirect=/gallery');
      return false;
    }
    return true;
  }, [isAuthenticated, message, router]);

  const patch = (id: string, changes: Partial<PublicPhoto>) =>
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  const toggleLike = useCallback(
    async (photo: PublicPhoto) => {
      if (!requireAuth()) return;
      const liked = !photo.likedByMe;
      patch(photo.id, { likedByMe: liked, likesCount: photo.likesCount + (liked ? 1 : -1) });
      try {
        const res = liked ? await client.like(photo.id) : await client.unlike(photo.id);
        patch(photo.id, { likedByMe: res.liked, likesCount: res.likesCount });
      } catch (err) {
        patch(photo.id, { likedByMe: photo.likedByMe, likesCount: photo.likesCount });
        message.error(err instanceof ApiError ? err.message : 'Action failed');
      }
    },
    [requireAuth, message],
  );

  const toggleBookmark = useCallback(
    async (photo: PublicPhoto) => {
      if (!requireAuth()) return;
      const bookmarked = !photo.bookmarkedByMe;
      patch(photo.id, { bookmarkedByMe: bookmarked });
      try {
        if (bookmarked) await client.bookmark(photo.id);
        else await client.unbookmark(photo.id);
      } catch (err) {
        patch(photo.id, { bookmarkedByMe: photo.bookmarkedByMe });
        message.error(err instanceof ApiError ? err.message : 'Action failed');
      }
    },
    [requireAuth, message],
  );

  const showFilters = !albumId;

  return (
    <section className={cn('mx-auto max-w-wide px-5 pb-20', showHeader ? 'pt-28' : 'pt-4')}>
      {showHeader && (
        <header className="mb-8">
          <h1 className="font-display text-display-lg font-semibold tracking-tight">Gallery</h1>
          <p className="mt-2 text-ink-muted">
            Browse the collection. Sign in to like and bookmark.
          </p>
        </header>
      )}

      {showFilters && (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={categoryId === null} onClick={() => setCategoryId(null)}>
              All
            </FilterChip>
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </FilterChip>
            ))}
          </div>
          <Input.Search
            allowClear
            placeholder="Search photos…"
            className="md:max-w-xs"
            onSearch={(v) => setSearch(v)}
            size="large"
          />
        </div>
      )}

      {photos.length === 0 && !loading ? (
        <Empty description="No photos yet" className="py-20" />
      ) : (
        <MasonryGrid>
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              priority={i < 4}
              onOpen={() => setLightboxIndex(i)}
              onToggleLike={toggleLike}
              onToggleBookmark={toggleBookmark}
            />
          ))}
        </MasonryGrid>
      )}

      <div ref={sentinelRef} className="flex justify-center py-10">
        {loading && <Spin />}
        {!hasMore && photos.length > 0 && (
          <p className="text-sm text-ink-muted">You’ve reached the end.</p>
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
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-pill px-4 py-1.5 text-sm transition active:scale-95',
        active
          ? 'bg-ink text-white dark:bg-white dark:text-ink'
          : 'bg-parchment text-ink-muted hover:text-ink dark:bg-tile-2 dark:text-parchment/70',
      )}
    >
      {children}
    </button>
  );
}
