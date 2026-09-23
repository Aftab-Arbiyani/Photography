import type { Metadata } from 'next';
import { CmsPageView } from '@/components/content/cms-page-view';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const page = await api.cmsPage('contact').catch(() => null);
  return buildMetadata({
    title: page?.metaTitle ?? page?.title ?? 'Contact',
    description: page?.metaDescription ?? 'Get in touch with the studio.',
    path: '/contact',
  });
}

export default function ContactPage() {
  return (
    <CmsPageView
      slug="contact"
      fallbackTitle="Contact"
      fallbackDescription="Reach the studio for commissions, licensing and press enquiries."
    />
  );
}
