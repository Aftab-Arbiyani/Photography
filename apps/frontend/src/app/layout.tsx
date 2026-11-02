import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { SiteNav } from '@/components/layout/site-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { Analytics } from '@/components/analytics/analytics';
import { buildMetadata } from '@/lib/seo';

// Inter for running text; Space Grotesk gives headlines and the wordmark their character.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
});
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: '#0e1012',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // `dark` is server-rendered so the first paint is already the dark stage.
      className={`dark ${inter.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint: viewers who chose light mode never see a dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-ink">
        <AppProviders>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-primary focus:px-4 focus:py-2 focus:text-ink-fixed"
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
