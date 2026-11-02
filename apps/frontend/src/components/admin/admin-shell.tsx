'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Result, Spin } from 'antd';
import { UserRole } from '@photography/types';
import { cn } from '@photography/ui';
import { useAuth } from '@/components/providers/auth-provider';
import { features } from '@/lib/config';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/orders', label: 'Orders' },
  ...(features.photographerApplications
    ? [{ href: '/admin/applications', label: 'Applications' }]
    : []),
  { href: '/admin/payouts', label: 'Payouts' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/photographers', label: 'Photographers' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/reports', label: 'Moderation' },
  { href: '/admin/cms', label: 'CMS pages' },
  { href: '/admin/email-templates', label: 'Email templates' },
  { href: '/admin/settings', label: 'Settings & flags' },
  { href: '/admin/audit', label: 'Audit log' },
];

/** Admin-only shell: redirects anonymous users to login, 403s non-admins. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated)
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [loading, isAuthenticated, router, pathname]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center pt-8">
        <Spin size="large" />
      </div>
    );
  }
  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="pt-8">
        <Result
          status="403"
          title="Admins only"
          subTitle="You don’t have access to the admin console."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-wide gap-8 px-5 pt-10 pb-20 md:grid md:grid-cols-[200px_1fr]">
      <aside className="mb-6 md:mb-0">
        <p className="mb-4 px-3 text-xs uppercase tracking-wider text-ink-muted">Admin</p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-sm transition',
                  active
                    ? 'bg-ink text-white dark:bg-white dark:text-ink-fixed'
                    : 'text-ink-muted hover:bg-parchment hover:text-ink dark:hover:bg-tile-2 dark:hover:text-parchment',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
