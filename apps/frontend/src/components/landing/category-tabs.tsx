import Link from 'next/link';
import type { PublicCategory } from '@photography/types';

/** Horizontal category shortcuts into the filtered gallery. */
export function CategoryTabs({ categories }: { categories: PublicCategory[] }) {
  if (!categories.length) return null;

  return (
    <nav aria-label="Browse by category" className="mx-auto max-w-wide px-4 pt-8 sm:px-5">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/gallery?category=${c.slug}`}
              className="block whitespace-nowrap rounded-pill border border-hairline px-4 py-1.5 text-sm font-semibold text-ink-muted transition hover:border-primary hover:text-ink"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
