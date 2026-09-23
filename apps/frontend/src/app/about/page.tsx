import type { Metadata } from 'next';
import { CmsPageView } from '@/components/content/cms-page-view';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const page = await api.cmsPage('about').catch(() => null);
  return buildMetadata({
    title: page?.metaTitle ?? page?.title ?? 'About',
    description: page?.metaDescription ?? 'About the studio and the photography platform.',
    path: '/about',
  });
}

export default function AboutPage() {
  return (
    <CmsPageView
      slug="about"
      fallbackTitle="About"
      fallbackDescription="The studio story, the craft and the people behind the lens."
    />
  );
}
