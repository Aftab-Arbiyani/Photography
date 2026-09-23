import Link from 'next/link';

interface PagePlaceholderProps {
  title: string;
  description: string;
}

/**
 * Phase-1 placeholder for pages whose full implementation lands in the
 * frontend phase. Keeps routing, layout and SEO real while signalling status.
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="flex min-h-[70svh] items-center justify-center px-5 pt-24">
      <div className="mx-auto max-w-content text-center">
        <p className="text-tagline text-primary">Coming in the next phase</p>
        <h1 className="font-display mt-3 text-display-lg font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lead text-ink-muted">{description}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-pill bg-primary px-6 py-3 text-base text-white transition active:scale-95"
        >
          Back home
        </Link>
      </div>
    </section>
  );
}
