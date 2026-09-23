'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MoonOutlined, ShoppingCartOutlined, SunOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { darkHeroRoutes, navLinks, siteConfig } from '@/lib/config';
import { useTheme } from '@/components/providers/theme-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { NavSearch } from './nav-search';
import { NotificationBell } from './notification-bell';

/** Primary action pill — inverts to solid white over a dark hero. */
const pillClasses = (onDark: boolean): string =>
  `rounded-pill px-4 py-1.5 text-[12px] font-medium transition active:scale-95 ${
    onDark ? 'bg-white text-ink hover:bg-white/90' : 'bg-ink text-white dark:bg-white dark:text-ink'
  }`;

/** Slim, frosted top navigation in the Apple grammar. */
export function SiteNav() {
  const { mode, toggle } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const heroOverlay = darkHeroRoutes.has(usePathname());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Floating over a dark hero: invert the type so it stays legible until scroll.
  const onDark = heroOverlay && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? 'bg-canvas/80 backdrop-blur-xl backdrop-saturate-150 dark:bg-tile-1/80'
          : 'bg-transparent'
      } ${onDark ? 'text-white' : ''}`}
    >
      <nav
        className="mx-auto flex h-12 max-w-wide items-center justify-between px-5 text-[12px]"
        aria-label="Primary"
      >
        <Link
          href="/"
          className={`font-display text-base font-semibold tracking-tight ${
            onDark ? 'text-white' : 'text-ink dark:text-parchment'
          }`}
        >
          {siteConfig.name}
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={
                  onDark
                    ? 'text-white/75 transition-colors hover:text-white'
                    : 'text-ink/70 transition-colors hover:text-ink dark:text-parchment/70 dark:hover:text-parchment'
                }
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <NavSearch onDark={onDark} />
          {isAuthenticated && <NotificationBell />}
          <button
            type="button"
            onClick={toggle}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              onDark
                ? 'text-white/85 hover:bg-white/15'
                : 'text-ink/80 hover:bg-ink/5 dark:text-parchment/80 dark:hover:bg-white/10'
            }`}
          >
            {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          </button>
          {isAuthenticated ? (
            <>
              <Link
                href="/cart"
                aria-label="Cart"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  onDark
                    ? 'text-white/85 hover:bg-white/15'
                    : 'text-ink/80 hover:bg-ink/5 dark:text-parchment/80 dark:hover:bg-white/10'
                }`}
              >
                <ShoppingCartOutlined />
              </Link>
              <Link
                href="/dashboard"
                className={`hidden transition-colors sm:inline ${
                  onDark
                    ? 'text-white/75 hover:text-white'
                    : 'text-ink/70 hover:text-ink dark:text-parchment/70 dark:hover:text-parchment'
                }`}
              >
                {user?.displayName ?? 'Account'}
              </Link>
              <button type="button" onClick={() => void logout()} className={pillClasses(onDark)}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className={pillClasses(onDark)}>
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
