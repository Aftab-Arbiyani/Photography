import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CursorPaginated, PublicAlbum, PublicPhoto } from '@photography/types';
import { GalleryClient } from '@/components/gallery/gallery-client';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const EMPTY: CursorPaginated<PublicPhoto> = { items: [], nextCursor: null, hasMore: false };

async function getAlbum(slug: string): Promise<PublicAlbum | null> {
  return api.album(slug).catch(() => null);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbum(slug);
  if (!album) return buildMetadata({ title: 'Album not found', path: `/albums/${slug}` });
  return buildMetadata({
    title: album.title,
    description: album.description ?? undefined,
    path: `/albums/${album.slug}`,
  });
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const album = await getAlbum(slug);
  if (!album) notFound();

  const initial = await api.gallery(`?albumId=${album.id}&limit=24`).catch(() => EMPTY);

  return (
    <div className="mx-auto max-w-wide px-5 pt-28">
      <header className="mb-6">
        <p className="text-tagline text-primary">Album</p>
        <h1 className="font-display mt-1 text-display-lg font-semibold tracking-tight">
          {album.title}
        </h1>
        {album.description && (
          <p className="mt-2 max-w-prose text-ink-muted">{album.description}</p>
        )}
      </header>
      <GalleryClient albumId={album.id} initial={initial} showHeader={false} />
    </div>
  );
}
