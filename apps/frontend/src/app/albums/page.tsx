import type { Metadata } from 'next';
import type { Paginated, PublicAlbum } from '@photography/types';
import { ContentTile } from '@/components/content/content-tile';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Albums',
  description: 'Photo albums organised by shoot, place and project.',
  path: '/albums',
});

export const dynamic = 'force-dynamic';

const EMPTY: Paginated<PublicAlbum> = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

export default async function AlbumsPage() {
  const albums = await api.albums().catch(() => EMPTY);

  return (
    <section className="mx-auto max-w-wide px-5 pt-10 pb-20">
      <header className="mb-10">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Albums</h1>
        <p className="mt-2 text-ink-muted">Bodies of work, organised by shoot and project.</p>
      </header>
      {albums.items.length === 0 ? (
        <p className="text-ink-muted">No published albums yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.items.map((a) => (
            <ContentTile
              key={a.id}
              href={`/albums/${a.slug}`}
              title={a.title}
              description={a.description}
              count={a.photosCount}
              countLabel="photos"
            />
          ))}
        </div>
      )}
    </section>
  );
}
