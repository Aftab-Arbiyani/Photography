/** Runtime configuration derived from public env vars. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Aperture',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  description:
    'Aperture — a photography platform where light, story and craft meet. Explore galleries, collections and the stories behind each frame.',
  twitter: '@aperture',
} as const;

/**
 * Routes that open with a dark, full-bleed hero under the fixed navigation.
 * The nav renders light-on-dark on these until the user scrolls — resolved from
 * the pathname (not a mount effect) so the very first paint is already correct.
 */
export const darkHeroRoutes: ReadonlySet<string> = new Set(['/']);

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/store', label: 'Store' },
  { href: '/collections', label: 'Collections' },
  { href: '/albums', label: 'Albums' },
  { href: '/about', label: 'About' },
] as const;
