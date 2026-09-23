import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchView } from '@/components/community/search-view';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({ title: 'Search', path: '/search' });

export default function SearchPage() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
