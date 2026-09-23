import { Transform } from 'class-transformer';

/**
 * Strip HTML/script content from user-supplied strings (defense-in-depth against
 * stored XSS). Dependency-free: removes tags, neutralizes angle brackets, and
 * collapses whitespace. Apply with @SanitizeText() on DTO string fields that
 * accept free text (comments, reviews, bios, report details).
 */
export function sanitizeText(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(sanitizeText);
  if (typeof input !== 'string') return input;
  return input
    .replace(/<\/?[a-z][^>]*>/gi, '') // strip HTML tags
    .replace(/[<>]/g, '') // neutralize stray angle brackets
    .replace(/\s{3,}/g, ' ') // collapse excessive whitespace
    .trim();
}

/** class-transformer decorator applying {@link sanitizeText}. */
export const SanitizeText = () => Transform(({ value }) => sanitizeText(value));
