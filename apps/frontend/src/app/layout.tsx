import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { SiteNav } from '@/components/layout/site-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { Analytics } from '@/components/analytics/analytics';
import { buildMetadata } from '@/lib/seo';

// Inter is the closest open-source stand-in for SF Pro (see design system notes).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
});
const interDisplay = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1d1d1f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-canvas text-ink dark:bg-tile-1 dark:text-parchment">
        <AppProviders>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <SiteNav />
          <main id="main">{children}</main>
          <SiteFooter />
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
