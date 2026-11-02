'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { MoonOutlined, ShoppingCartOutlined, SunOutlined } from '@ant-design/icons';
import { cn } from '@photography/ui';
import { navLinks, siteConfig } from '@/lib/config';
import { useTheme } from '@/components/providers/theme-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { NavSearch } from './nav-search';
import { NotificationBell } from './notification-bell';

const iconButton =
  'flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition hover:bg-ink/10 hover:text-ink';

/** Solid, sticky top bar: brand, section tabs, search and account controls. */
export function SiteNav() {
  const pathname = usePathname();
  const { mode, toggle } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const accountMenu: MenuProps['items'] = [
    { key: 'dashboard', label: <Link href="/dashboard">Dashboard</Link> },
    { key: 'bookmarks', label: <Link href="/dashboard/bookmarks">Saved</Link> },
    { key: 'downloads', label: <Link href="/dashboard/downloads">Downloads</Link> },
    { key: 'orders', label: <Link href="/dashboard/orders">Orders</Link> },
    { type: 'divider' },
    { key: 'logout', label: 'Sign out', onClick: () => void logout() },
  ];

  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/90 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-14 max-w-wide items-center gap-4 px-4 sm:px-5"
        aria-label="Primary"
      >
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-ink-fixed"
          >
            {siteConfig.name.charAt(0)}
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight text-ink sm:inline">
            {siteConfig.name}
          </span>
        </Link>

        <ul className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto text-sm font-semibold">
          {navLinks.map((link) => (
            <li key={link.href} className={link.href === '/about' ? 'hidden lg:block' : undefined}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'relative block whitespace-nowrap rounded-md px-3 py-2 transition-colors',
                  isActive(link.href)
                    ? 'text-ink after:absolute after:inset-x-3 after:-bottom-[9px] after:h-[3px] after:rounded-full after:bg-primary'
                    : 'text-ink-muted hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <NavSearch />
          {isAuthenticated && <NotificationBell />}
          <button
            type="button"
            onClick={toggle}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={iconButton}
          >
            {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          </button>
          {isAuthenticated ? (
            <>
              <Link href="/cart" aria-label="Cart" className={iconButton}>
                <ShoppingCartOutlined />
              </Link>
              <Dropdown menu={{ items: accountMenu }} trigger={['click']} placement="bottomRight">
                <button
                  type="button"
                  aria-label={`Account menu for ${user?.displayName ?? 'you'}`}
                  className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-tile-2 text-sm font-bold text-white ring-2 ring-transparent transition hover:ring-primary"
                >
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- storage-served avatar
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </button>
              </Dropdown>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-pill px-3 py-1.5 text-sm font-semibold text-ink-muted transition hover:text-ink sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-pill bg-primary px-4 py-1.5 text-sm font-bold text-ink-fixed transition hover:bg-primary-focus active:scale-95"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
