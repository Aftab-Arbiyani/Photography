import type { Metadata } from 'next';
import { CheckoutView } from '@/components/store/checkout-view';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...buildMetadata({ title: 'Checkout', path: '/checkout' }),
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
