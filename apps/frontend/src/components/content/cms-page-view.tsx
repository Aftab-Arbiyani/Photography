import { marked } from 'marked';
import { api } from '@/lib/api';
import { PagePlaceholder } from '@/components/layout/page-placeholder';

interface CmsPageViewProps {
  slug: string;
  /** Shown when the CMS page is missing/unpublished so the route never 404s. */
  fallbackTitle: string;
  fallbackDescription: string;
}

/**
 * Server component that renders a published CMS page by slug.
 * Falls back to a placeholder when the page hasn't been authored yet,
 * so /about, /terms, /privacy etc. always resolve.
 */
export async function CmsPageView({ slug, fallbackTitle, fallbackDescription }: CmsPageViewProps) {
  const page = await api.cmsPage(slug).catch(() => null);

  if (!page) {
    return <PagePlaceholder title={fallbackTitle} description={fallbackDescription} />;
  }

  // CMS body is authored as Markdown (HTML passes through marked unchanged).
  const html = marked.parse(page.body, { async: false }) as string;

  return (
    <article className="mx-auto max-w-content px-5 pb-24 pt-10">
      <header className="mb-10 border-b border-line pb-8">
        <p className="text-tagline text-primary">{siteSection(slug)}</p>
        <h1 className="font-display mt-3 text-display-lg font-semibold tracking-tight">
          {page.title}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Updated {new Date(page.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
        </p>
      </header>
      {/* Body is admin-authored Markdown, rendered to HTML at build/ISR time. */}
      <div
        className="cms-prose space-y-5 text-lg leading-relaxed text-ink/90 [&_a]:text-primary [&_a]:underline [&_h1]:font-display [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:font-display [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}

function siteSection(slug: string): string {
  if (slug.includes('privacy')) return 'Privacy';
  if (slug.includes('terms')) return 'Legal';
  if (slug.includes('faq')) return 'Help';
  if (slug.includes('contact')) return 'Contact';
  return 'About';
}
