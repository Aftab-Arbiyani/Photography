import type { Metadata } from 'next';
import { CmsPageView } from '@/components/content/cms-page-view';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const page = await api.cmsPage('privacy').catch(() => null);
  return buildMetadata({
    title: page?.metaTitle ?? page?.title ?? 'Privacy Policy',
    description: page?.metaDescription ?? 'How we handle your data.',
    path: '/privacy',
  });
}

export default function PrivacyPage() {
  return (
    <CmsPageView
      slug="privacy"
      fallbackTitle="Privacy Policy"
      fallbackDescription="How we collect, use and protect your personal data."
    />
  );
}
