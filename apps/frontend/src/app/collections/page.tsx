import type { Metadata } from 'next';
import type { Paginated, PublicCollection } from '@photography/types';
import { ContentTile } from '@/components/content/content-tile';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Collections',
  description: 'Curated photo collections spanning albums and themes.',
  path: '/collections',
});

export const dynamic = 'force-dynamic';

const EMPTY: Paginated<PublicCollection> = {
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

export default async function CollectionsPage() {
  const collections = await api.collections().catch(() => EMPTY);

  return (
    <section className="mx-auto max-w-wide px-5 pt-28 pb-20">
      <header className="mb-10">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Collections</h1>
        <p className="mt-2 text-ink-muted">Curated groupings that cross albums and themes.</p>
      </header>
      {collections.items.length === 0 ? (
        <p className="text-ink-muted">No published collections yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.items.map((c) => (
            <ContentTile
              key={c.id}
              href={`/collections/${c.slug}`}
              title={c.title}
              description={c.description}
              count={c.photosCount}
              countLabel="photos"
            />
          ))}
        </div>
      )}
    </section>
  );
}
