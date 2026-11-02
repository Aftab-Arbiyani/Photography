import Link from 'next/link';
import type { PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';

/**
 * Closing call to action over a full-width photograph: create a free account to
 * fave, save and get new drops. Falls back to a generated plate with no photo.
 */
export function JoinBand({ photo }: { photo: PublicPhoto | null }) {
  return (
    <section className="mx-auto max-w-wide px-4 pb-16 pt-6 sm:px-5">
      <div className="relative isolate flex min-h-[340px] items-end overflow-hidden rounded-2xl px-6 py-10 text-white sm:px-10 md:items-center">
        <div aria-hidden className="absolute inset-0 -z-10">
          <PhotoFrame photo={photo} seed="join-band" palette={3} grain sizes="100vw" />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10"
        />
        <div className="max-w-lg">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Don’t miss the next drop.
          </h2>
          <p className="mt-3 text-white/80">
            Create a free account to fave photos, build your own collections and hear first when a
            new set lands.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-pill bg-primary px-6 py-3 text-sm font-bold text-ink-fixed transition hover:bg-primary-focus active:scale-95"
          >
            Join free
          </Link>
        </div>
      </div>
    </section>
  );
}
