import Link from 'next/link';
import { siteConfig } from '@/lib/config';

const columns = [
  {
    heading: 'Explore',
    links: [
      { href: '/gallery', label: 'Discover' },
      { href: '/store', label: 'Shop' },
      { href: '/collections', label: 'Collections' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { href: '/about', label: 'About' },
      { href: '/faq', label: 'FAQ' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
];

/** Compact footer: brand mark and a one-line pitch, then three link groups. */
export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-parchment dark:bg-tile-3">
      <div className="mx-auto flex max-w-wide flex-col gap-8 px-5 py-10 md:flex-row md:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-ink-fixed"
            >
              {siteConfig.name.charAt(0)}
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              {siteConfig.name}
            </span>
          </Link>
          <p className="mt-3 max-w-md text-sm text-ink-muted">
            Original photography and model sets, in full resolution.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-3 gap-8 sm:gap-16">
          {columns.map((col) => (
            <div key={col.heading}>
              <h2 className="text-sm font-semibold text-ink">{col.heading}</h2>
              <ul className="mt-3 space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-0.5 text-sm text-ink-muted transition hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-wide px-5 py-5 text-xs text-ink-muted">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
