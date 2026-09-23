'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spin } from 'antd';
import {
  AppstoreOutlined,
  BellOutlined,
  CloudUploadOutlined,
  CompassOutlined,
  CrownOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  HeartOutlined,
  PictureOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { UserRole } from '@photography/types';
import { cn } from '@photography/ui';
import { useAuth } from '@/components/providers/auth-provider';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: <AppstoreOutlined /> },
  { href: '/dashboard/feed', label: 'Activity', icon: <CompassOutlined /> },
  { href: '/dashboard/profile', label: 'Profile', icon: <UserOutlined /> },
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: <HeartOutlined /> },
  { href: '/dashboard/wishlist', label: 'Wishlist', icon: <ShoppingOutlined /> },
  { href: '/dashboard/orders', label: 'Orders', icon: <ShoppingOutlined /> },
  { href: '/dashboard/downloads', label: 'Downloads', icon: <DownloadOutlined /> },
  { href: '/dashboard/notifications', label: 'Notifications', icon: <BellOutlined /> },
  { href: '/account/membership', label: 'Membership', icon: <CrownOutlined /> },
  {
    href: '/dashboard/upload',
    label: 'Upload',
    icon: <CloudUploadOutlined />,
    roles: [UserRole.PHOTOGRAPHER, UserRole.ADMIN],
  },
  {
    href: '/dashboard/studio',
    label: 'My content',
    icon: <FolderOpenOutlined />,
    roles: [UserRole.PHOTOGRAPHER, UserRole.ADMIN],
  },
  // Visible to everyone: photographers see earnings, regular users see the apply flow.
  { href: '/dashboard/photographer', label: 'Photographer', icon: <PictureOutlined /> },
];

/**
 * Client shell for the authenticated dashboard: redirects anonymous users to
 * login, renders a role-aware sidebar, and frames each dashboard page.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center pt-24">
        <Spin size="large" />
      </div>
    );
  }

  const items = NAV.filter((i) => !i.roles || i.roles.includes(user.role));

  return (
    <div className="mx-auto max-w-wide gap-8 px-5 pt-28 pb-20 md:grid md:grid-cols-[220px_1fr]">
      <aside className="mb-6 md:mb-0">
        <p className="mb-4 px-3 text-xs uppercase tracking-wider text-ink-muted">
          {user.displayName}
        </p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition',
                  active
                    ? 'bg-ink text-white dark:bg-white dark:text-ink'
                    : 'text-ink-muted hover:bg-parchment hover:text-ink dark:hover:bg-tile-2 dark:hover:text-parchment',
                )}
              >
                <span aria-hidden>{item.icon}</span>
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
