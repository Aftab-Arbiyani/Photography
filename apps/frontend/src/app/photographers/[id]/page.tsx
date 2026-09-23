'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { App, Avatar, Button, Empty, Spin } from 'antd';
import { MasonryGrid, PhotoCard } from '@photography/ui';
import type { PublicPhoto, PublicPhotographer } from '@photography/types';
import { client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

export default function PhotographerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { message } = App.useApp();

  const [profile, setProfile] = useState<PublicPhotographer | null>(null);
  const [photos, setPhotos] = useState<PublicPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await client.photographer(id);
      setProfile(p);
      const g = await client.gallery(`?photographerId=${id}&limit=24`).catch(() => null);
      if (g) setPhotos(g.items);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/photographers/${id}`);
      return;
    }
    if (!profile) return;
    setBusy(true);
    const following = !profile.isFollowing;
    try {
      const res = following ? await client.follow(id) : await client.unfollow(id);
      setProfile({ ...profile, isFollowing: following, followersCount: res.followersCount });
    } catch {
      message.error('Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[60svh] items-center justify-center pt-24">
        <Spin size="large" />
      </div>
    );
  if (!profile)
    return (
      <div className="mx-auto max-w-content px-5 pt-28">
        <Empty description="Photographer not found" />
      </div>
    );

  const isSelf = user?.id === id;

  return (
    <section className="mx-auto max-w-wide px-5 pt-28 pb-20">
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
        <Avatar size={96} src={profile.avatarUrl ?? undefined}>
          {profile.displayName[0]?.toUpperCase()}
        </Avatar>
        <div className="flex-1">
          <h1 className="font-display text-display-lg font-semibold tracking-tight">
            {profile.displayName}
          </h1>
          {profile.bio && <p className="mt-1 max-w-prose text-ink-muted">{profile.bio}</p>}
          <div className="mt-3 flex items-center justify-center gap-6 text-sm sm:justify-start">
            <span>
              <strong>{profile.photosCount}</strong> photos
            </span>
            <span>
              <strong>{profile.followersCount}</strong> followers
            </span>
            <span>
              <strong>{profile.followingCount}</strong> following
            </span>
          </div>
        </div>
        {!isSelf && (
          <Button
            type={profile.isFollowing ? 'default' : 'primary'}
            loading={busy}
            onClick={toggleFollow}
          >
            {profile.isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </header>

      <div className="mt-10">
        {photos.length === 0 ? (
          <Empty description="No published photos yet" className="py-16" />
        ) : (
          <MasonryGrid>
            {photos.map((p) => (
              <PhotoCard key={p.id} photo={p} onOpen={(ph) => router.push(`/photos/${ph.slug}`)} />
            ))}
          </MasonryGrid>
        )}
      </div>
    </section>
  );
}
