import type { Metadata } from 'next';
import { PricingView } from '@/components/membership/pricing-view';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Membership & Pricing',
  description:
    'Upgrade to premium for higher-resolution downloads, exclusive galleries and priority support.',
  path: '/pricing',
});

export default function PricingPage() {
  return <PricingView />;
}
