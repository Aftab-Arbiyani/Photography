import type { PublicPhoto } from '@photography/types';

/**
 * One-line capture credit — "Canon EOS R5 · 35mm · ƒ/1.8 · 1/250 · ISO 100".
 * Mirrors the labelling used by the photo page's ExifPanel. Returns null when
 * the frame carries no usable EXIF.
 */
export function captureLine(photo: PublicPhoto | null | undefined): string | null {
  if (!photo?.exif) return null;
  const { cameraMake, cameraModel, focalLength, aperture, shutterSpeed, iso } = photo.exif;
  const parts = [
    [cameraMake, cameraModel].filter(Boolean).join(' ') || null,
    focalLength ? `${focalLength}mm` : null,
    aperture ? `ƒ/${aperture}` : null,
    shutterSpeed,
    iso ? `ISO ${iso}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** Compact engagement counter — 1240 → "1.2k". */
export function compactCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}m`;
}
