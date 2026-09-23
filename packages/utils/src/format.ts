/** Compute a normalized aspect ratio (width / height), guarding divide-by-zero. */
export function aspectRatio(width: number, height: number): number {
  if (!height) return 1;
  return Math.round((width / height) * 1000) / 1000;
}

/** Human-readable display name with sensible fallbacks. */
export function displayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string,
): string {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (email) return email.split('@')[0];
  return 'Anonymous';
}

/** Format a shutter-speed float (e.g. 0.004) into a fraction string ("1/250"). */
export function formatShutterSpeed(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  if (seconds >= 1) return `${seconds}s`;
  return `1/${Math.round(1 / seconds)}`;
}
