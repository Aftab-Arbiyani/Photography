import type { Metadata } from 'next';
import { CartView } from '@/components/store/cart-view';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...buildMetadata({ title: 'Cart', path: '/cart' }),
  robots: { index: false },
};

export default function CartPage() {
  return <CartView />;
}
