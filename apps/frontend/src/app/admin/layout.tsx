import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...buildMetadata({ title: 'Admin', path: '/admin' }),
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
