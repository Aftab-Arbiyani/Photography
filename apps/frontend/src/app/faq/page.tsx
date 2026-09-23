import type { Metadata } from 'next';
import { CmsPageView } from '@/components/content/cms-page-view';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const page = await api.cmsPage('faq').catch(() => null);
  return buildMetadata({
    title: page?.metaTitle ?? page?.title ?? 'FAQ',
    description: page?.metaDescription ?? 'Frequently asked questions.',
    path: '/faq',
  });
}

export default function FaqPage() {
  return (
    <CmsPageView
      slug="faq"
      fallbackTitle="FAQ"
      fallbackDescription="Answers to common questions about the platform and licensing."
    />
  );
}
