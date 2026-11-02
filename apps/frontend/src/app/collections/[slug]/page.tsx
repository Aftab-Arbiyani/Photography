import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MasonryGrid, ResponsiveImage } from '@photography/ui';
import type { PublicCollection, PublicPhoto } from '@photography/types';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCollection(slug: string): Promise<PublicCollection | null> {
  return api.collection(slug).catch(() => null);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection)
    return buildMetadata({ title: 'Collection not found', path: `/collections/${slug}` });
  return buildMetadata({
    title: collection.title,
    description: collection.description ?? undefined,
    path: `/collections/${collection.slug}`,
  });
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const photos = await api.collectionPhotos(slug).catch((): PublicPhoto[] => []);

  return (
    <section className="mx-auto max-w-wide px-5 pt-10 pb-20">
      <header className="mb-10">
        <p className="text-tagline text-primary">Collection</p>
        <h1 className="font-display mt-1 text-display-lg font-semibold tracking-tight">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="mt-2 max-w-prose text-ink-muted">{collection.description}</p>
        )}
      </header>

      {photos.length === 0 ? (
        <p className="text-ink-muted">This collection has no published photos yet.</p>
      ) : (
        <MasonryGrid>
          {photos.map((p) => (
            <Link
              key={p.id}
              href={`/photos/${p.slug}`}
              className="mb-4 block break-inside-avoid overflow-hidden rounded-card"
            >
              <ResponsiveImage
                assets={p.assets}
                alt={p.title}
                width={p.width}
                height={p.height}
                className="transition-transform duration-500 hover:scale-[1.02]"
              />
            </Link>
          ))}
        </MasonryGrid>
      )}
    </section>
  );
}
