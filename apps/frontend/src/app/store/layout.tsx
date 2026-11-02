import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

// The shop page itself is a client component, so its metadata lives here.
export const metadata: Metadata = buildMetadata({
  title: 'Shop',
  description: 'Full-resolution photo sets and downloads, delivered instantly.',
  path: '/store',
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
