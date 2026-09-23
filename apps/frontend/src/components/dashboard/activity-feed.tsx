'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Empty, Spin } from 'antd';
import { MasonryGrid, PhotoCard } from '@photography/ui';
import type { PublicPhoto } from '@photography/types';
import { client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

interface FeedEntry {
  photo: PublicPhoto;
  photographerName: string;
}

/**
 * A following activity feed: merges recent uploads from photographers the
 * current user follows, newest first. Composed from existing endpoints
 * (following list + per-photographer gallery) — no new backend needed.
 */
export function ActivityFeed() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    (async () => {
      try {
        const followingList = await client.photographerFollowing(user.id);
        if (followingList.items.length === 0) {
          setFollowing(false);
          return;
        }
        const perPhotographer = await Promise.all(
          followingList.items.slice(0, 20).map((p) =>
            client.studio
              .myPhotos(p.id)
              .then((r) => r.items.map((photo) => ({ photo, photographerName: p.displayName })))
              .catch(() => [] as FeedEntry[]),
          ),
        );
        const merged = perPhotographer
          .flat()
          .sort(
            (a, b) =>
              +new Date(b.photo.publishedAt ?? b.photo.createdAt) -
              +new Date(a.photo.publishedAt ?? a.photo.createdAt),
          )
          .slice(0, 60);
        setEntries(merged);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated, user]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );

  if (!following) {
    return (
      <Empty description="Follow photographers to see their latest work here.">
        <Link href="/photographers" className="text-primary">
          Browse photographers
        </Link>
      </Empty>
    );
  }

  if (entries.length === 0)
    return <Empty description="No recent uploads from people you follow." />;

  return (
    <MasonryGrid>
      {entries.map(({ photo, photographerName }) => (
        <div key={photo.id}>
          <PhotoCard photo={photo} onOpen={() => router.push(`/photos/${photo.slug}`)} />
          <p className="mt-1 px-1 text-xs text-ink-muted">by {photographerName}</p>
        </div>
      ))}
    </MasonryGrid>
  );
}
