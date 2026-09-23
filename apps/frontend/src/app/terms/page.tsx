import type { Metadata } from 'next';
import { CmsPageView } from '@/components/content/cms-page-view';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const page = await api.cmsPage('terms').catch(() => null);
  return buildMetadata({
    title: page?.metaTitle ?? page?.title ?? 'Terms of Service',
    description: page?.metaDescription ?? 'The terms governing use of the platform.',
    path: '/terms',
  });
}

export default function TermsPage() {
  return (
    <CmsPageView
      slug="terms"
      fallbackTitle="Terms of Service"
      fallbackDescription="The terms governing use of the platform and licensed content."
    />
  );
}
