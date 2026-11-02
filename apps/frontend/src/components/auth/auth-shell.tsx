'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered, minimal auth card in the Apple grammar. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <section className="flex min-h-[100svh] items-center justify-center px-5 pt-8 pb-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-display mb-8 block text-center text-2xl font-semibold tracking-tight"
        >
          Aperture
        </Link>
        <div className="rounded-card border border-hairline/60 bg-canvas p-8 dark:border-white/10 dark:bg-tile-2">
          <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
      </div>
    </section>
  );
}
