import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ResponsiveImage } from '@photography/ui';
import type { PublicPhoto } from '@photography/types';
import { ExifPanel } from '@/components/photo/exif-panel';
import { PhotoActions } from '@/components/photo/photo-actions';
import { PhotoSocial } from '@/components/photo/photo-social';
import { CommentsSection } from '@/components/photo/comments-section';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPhoto(slug: string): Promise<PublicPhoto | null> {
  return api.photo(slug).catch(() => null);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const photo = await getPhoto(slug);
  if (!photo) return buildMetadata({ title: 'Photo not found', path: `/photos/${slug}` });
  return buildMetadata({
    title: photo.title,
    description: photo.description ?? photo.story ?? siteConfig.description,
    path: `/photos/${photo.slug}`,
    image: photo.assets.webp || photo.assets.original,
    type: 'article',
  });
}

function imageObjectJsonLd(photo: PublicPhoto) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: photo.title,
    description: photo.description ?? undefined,
    contentUrl: photo.assets.original,
    thumbnailUrl: photo.assets.thumbnail,
    width: photo.width,
    height: photo.height,
    uploadDate: photo.publishedAt ?? photo.createdAt,
  };
}

export default async function PhotoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const photo = await getPhoto(slug);
  if (!photo) notFound();

  const related = await api.relatedPhotos(slug).catch((): PublicPhoto[] => []);

  return (
    <article className="mx-auto max-w-content px-5 pt-28 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObjectJsonLd(photo)) }}
      />

      <ResponsiveImage
        assets={photo.assets}
        alt={photo.title}
        width={photo.width}
        height={photo.height}
        priority
        sizes="(max-width: 980px) 100vw, 980px"
        className="rounded-card shadow-product"
      />

      <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-display-lg font-semibold tracking-tight">
            {photo.title}
          </h1>
          {photo.description && (
            <p className="mt-2 max-w-prose text-ink-muted">{photo.description}</p>
          )}
          <Link
            href={`/photographers/${photo.photographerId}`}
            className="mt-2 inline-block text-sm text-primary"
          >
            View photographer
          </Link>
        </div>
        <div className="flex flex-col items-start gap-3">
          <PhotoActions photo={photo} />
          <PhotoSocial photoId={photo.id} photoSlug={photo.slug} />
        </div>
      </header>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]">
        <div>
          {photo.story && (
            <section>
              <h2 className="font-display mb-3 text-tagline font-semibold">The story</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink dark:text-parchment/90">
                {photo.story}
              </p>
            </section>
          )}
          <CommentsSection photoId={photo.id} />
        </div>
        <aside>
          <ExifPanel exif={photo.exif} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display mb-5 text-tagline font-semibold">Related</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/photos/${r.slug}`}
                className="group block overflow-hidden rounded-card"
              >
                <ResponsiveImage
                  assets={r.assets}
                  alt={r.title}
                  width={r.width}
                  height={r.height}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="aspect-square transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
