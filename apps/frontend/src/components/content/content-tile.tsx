import Link from 'next/link';

interface ContentTileProps {
  href: string;
  title: string;
  description: string | null;
  count: number;
  countLabel: string;
}

/** Minimal text tile for album/collection listings (Apple-grammar, no chrome). */
export function ContentTile({ href, title, description, count, countLabel }: ContentTileProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-card border border-hairline/60 bg-canvas p-6 transition hover:border-ink/30 dark:border-white/10 dark:bg-tile-2 dark:hover:border-white/30"
    >
      <div>
        <h2 className="font-display text-tagline font-semibold tracking-tight transition-colors group-hover:text-primary">
          {title}
        </h2>
        {description && <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{description}</p>}
      </div>
      <p className="mt-6 text-xs uppercase tracking-wider text-ink-muted">
        {count} {countLabel}
      </p>
    </Link>
  );
}
