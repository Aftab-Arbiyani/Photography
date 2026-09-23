import Link from 'next/link';
import { siteConfig } from '@/lib/config';

const columns = [
  {
    heading: 'Explore',
    links: [
      { href: '/gallery', label: 'Gallery' },
      { href: '/collections', label: 'Collections' },
      { href: '/albums', label: 'Albums' },
    ],
  },
  {
    heading: 'Studio',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/register', label: 'Create account' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-parchment dark:bg-tile-3">
      <div className="mx-auto grid max-w-wide grid-cols-2 gap-8 px-5 py-16 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-lg font-semibold">{siteConfig.name}</p>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">{siteConfig.description}</p>
        </div>
        {columns.map((col) => (
          <div key={col.heading}>
            <p className="text-[14px] font-semibold text-ink dark:text-parchment">{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted transition hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline/60 dark:border-white/10">
        <p className="mx-auto max-w-wide px-5 py-6 text-xs text-ink-muted">
          © {new Date().getFullYear()} {siteConfig.name}. Crafted for photographers.
        </p>
      </div>
    </footer>
  );
}
