/** Runtime configuration derived from public env vars. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Aperture',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  description:
    'Aperture — original photography and model sets. Browse the gallery, fave your favourites and buy high-resolution downloads.',
  twitter: '@aperture',
} as const;

/**
 * UI feature toggles. Hidden features keep their code and API wiring — flip the
 * env var to bring them back.
 */
export const features = {
  /** Let regular users apply to become photographers. Off: only admins upload. */
  photographerApplications: process.env.NEXT_PUBLIC_ENABLE_PHOTOGRAPHER_APPLICATIONS === 'true',
} as const;

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Discover' },
  { href: '/store', label: 'Shop' },
  { href: '/collections', label: 'Collections' },
  { href: '/about', label: 'About' },
] as const;
