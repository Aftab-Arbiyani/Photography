'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App } from 'antd';
import type { PublicPhoto } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * Optimistic fave (like) and save (bookmark) toggles over a list of photos held
 * in the caller's state. Anonymous users are sent to sign in and come back here.
 */
export function useEngagement(setPhotos: Dispatch<SetStateAction<PublicPhoto[]>>) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();

  const requireAuth = useCallback((): boolean => {
    if (isAuthenticated) return true;
    message.info('Sign in to do that.');
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    return false;
  }, [isAuthenticated, message, pathname, router]);

  const patch = useCallback(
    (id: string, changes: Partial<PublicPhoto>) =>
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p))),
    [setPhotos],
  );

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
    [requireAuth, patch, message],
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
    [requireAuth, patch, message],
  );

  return { toggleLike, toggleBookmark };
}
