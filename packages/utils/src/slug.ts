/**
 * Convert an arbitrary string into a URL-safe slug.
 * - lowercases
 * - strips diacritics
 * - replaces non-alphanumerics with single hyphens
 * - trims leading/trailing hyphens
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Append a short random suffix to guarantee uniqueness when a base slug collides.
 * Deterministic-friendly: the suffix source is injectable for testing.
 */
export function uniqueSlug(base: string, suffix?: string): string {
  const root = slugify(base) || 'item';
  const tail = suffix ?? Math.random().toString(36).slice(2, 8);
  return `${root}-${tail}`;
}
