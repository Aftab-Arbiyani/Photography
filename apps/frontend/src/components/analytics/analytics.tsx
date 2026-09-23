'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { client } from '@/lib/api-client';

const VISITOR_COOKIE = 'aperture_vid';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function readVisitorId(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_COOKIE}=([^;]+)`));
  if (match) return decodeURIComponent(match[1]);
  // Stable anonymous id; 1-year first-party cookie.
  const id =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
  return id;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * First-party analytics: maintains an anonymous visitor-id cookie, captures
 * pageviews to our own /analytics/events endpoint, and (optionally) forwards
 * to GA4/GTM when NEXT_PUBLIC_GA_ID is set.
 */
export function Analytics() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const visitorId = readVisitorId();
    const path = pathname + (search.toString() ? `?${search.toString()}` : '');

    // First-party capture (best-effort; never blocks rendering).
    client
      .trackEvent({ type: 'pageview', visitorId, path, referrer: document.referrer || undefined })
      .catch(() => undefined);

    // GA4 page_view on client navigations.
    if (GA_ID && window.gtag) {
      window.gtag('event', 'page_view', { page_path: path });
    }
  }, [pathname, search]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
