'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import {
  BookFilled,
  BookOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { PublicPhoto } from '@photography/types';
import { cn } from '@photography/ui';
import { ApiError, client } from '@/lib/api-client';
import { compactCount } from '@/lib/photo-meta';
import { useAuth } from '@/components/providers/auth-provider';

const toggleBase =
  'inline-flex h-10 items-center gap-2 rounded-pill border px-4 text-sm font-semibold transition active:scale-95';
const toggleOff = 'border-hairline bg-canvas text-ink hover:border-ink/40 dark:bg-tile-2';
const toggleOn = 'border-primary/60 bg-primary/10 text-ink';

interface PhotoActionsProps {
  photo: PublicPhoto;
  /** Extra controls appended to the button row (the page passes share/report). */
  children?: ReactNode;
}

/**
 * Engagement block for the photo page: fave / comment / view counts, then the
 * Fave and Save toggles (optimistic). The fave count lives here, next to the
 * toggle, so it moves with it.
 */
export function PhotoActions({ photo, children }: PhotoActionsProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const [liked, setLiked] = useState(photo.likedByMe ?? false);
  const [likes, setLikes] = useState(photo.likesCount);
  const [bookmarked, setBookmarked] = useState(photo.bookmarkedByMe ?? false);
  const [busy, setBusy] = useState(false);

  // The page is server-rendered anonymously, so it can't know this viewer's
  // fave/save state. Fetch it once signed in, or the first click would be a no-op.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    client
      .photo(photo.slug)
      .then((fresh) => {
        if (cancelled) return;
        setLiked(fresh.likedByMe ?? false);
        setBookmarked(fresh.bookmarkedByMe ?? false);
        setLikes(fresh.likesCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, photo.slug]);

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
    <div>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
        <Stat icon={<HeartOutlined aria-hidden />} value={likes} noun="fave" />
        <Stat icon={<MessageOutlined aria-hidden />} value={photo.commentsCount} noun="comment" />
        <Stat icon={<EyeOutlined aria-hidden />} value={photo.viewsCount} noun="view" />
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={liked}
          onClick={onLike}
          className={cn(toggleBase, liked ? toggleOn : toggleOff)}
        >
          {liked ? (
            <HeartFilled aria-hidden className="!text-primary" />
          ) : (
            <HeartOutlined aria-hidden />
          )}
          {liked ? 'Faved' : 'Fave'}
        </button>
        <button
          type="button"
          aria-pressed={bookmarked}
          onClick={onBookmark}
          className={cn(toggleBase, bookmarked ? toggleOn : toggleOff)}
        >
          {bookmarked ? (
            <BookFilled aria-hidden className="!text-primary" />
          ) : (
            <BookOutlined aria-hidden />
          )}
          {bookmarked ? 'Saved' : 'Save'}
        </button>
        {children}
      </div>
    </div>
  );
}

function Stat({ icon, value, noun }: { icon: ReactNode; value: number; noun: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {icon}
      <span>
        <span className="font-semibold text-ink">{compactCount(value)}</span>{' '}
        {value === 1 ? noun : `${noun}s`}
      </span>
    </li>
  );
}
