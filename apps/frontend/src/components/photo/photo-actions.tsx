'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button } from 'antd';
import { HeartFilled, HeartOutlined, BookFilled, BookOutlined } from '@ant-design/icons';
import type { PublicPhoto } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

/** Like + bookmark controls for the photo detail page (optimistic). */
export function PhotoActions({ photo }: { photo: PublicPhoto }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const [liked, setLiked] = useState(photo.likedByMe ?? false);
  const [likes, setLikes] = useState(photo.likesCount);
  const [bookmarked, setBookmarked] = useState(photo.bookmarkedByMe ?? false);
  const [busy, setBusy] = useState(false);

  const guard = () => {
    if (!isAuthenticated) {
      message.info('Sign in to do that.');
      router.push(`/login?redirect=/photos/${photo.slug}`);
      return false;
    }
    return true;
  };

  const onLike = async () => {
    if (!guard() || busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = next ? await client.like(photo.id) : await client.unlike(photo.id);
      setLiked(res.liked);
      setLikes(res.likesCount);
    } catch (err) {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
      message.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const onBookmark = async () => {
    if (!guard() || busy) return;
    setBusy(true);
    const next = !bookmarked;
    setBookmarked(next);
    try {
      if (next) await client.bookmark(photo.id);
      else await client.unbookmark(photo.id);
    } catch (err) {
      setBookmarked(!next);
      message.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        size="large"
        icon={liked ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
        onClick={onLike}
      >
        {likes}
      </Button>
      <Button
        size="large"
        icon={bookmarked ? <BookFilled style={{ color: '#0066cc' }} /> : <BookOutlined />}
        onClick={onBookmark}
      >
        {bookmarked ? 'Saved' : 'Save'}
      </Button>
    </div>
  );
}
