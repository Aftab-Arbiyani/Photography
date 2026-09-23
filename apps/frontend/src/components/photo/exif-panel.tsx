import type { PhotoExif } from '@photography/types';

interface ExifPanelProps {
  exif: PhotoExif | null;
}

const Row = ({ label, value }: { label: string; value: string | number | null }) =>
  value === null || value === '' ? null : (
    <div className="flex items-center justify-between border-b border-hairline/60 py-2.5 text-sm last:border-0 dark:border-white/10">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

/** Camera/lens/exposure metadata table. Renders nothing if no EXIF is present. */
export function ExifPanel({ exif }: ExifPanelProps) {
  if (!exif) return null;
  const camera = [exif.cameraMake, exif.cameraModel].filter(Boolean).join(' ');

  return (
    <div className="rounded-card border border-hairline/60 p-5 dark:border-white/10">
      <h2 className="font-display mb-2 text-tagline font-semibold">Capture details</h2>
      <Row label="Camera" value={camera || null} />
      <Row label="Lens" value={exif.lensModel} />
      <Row label="ISO" value={exif.iso} />
      <Row label="Shutter" value={exif.shutterSpeed} />
      <Row label="Aperture" value={exif.aperture ? `ƒ/${exif.aperture}` : null} />
      <Row label="Focal length" value={exif.focalLength ? `${exif.focalLength}mm` : null} />
      <Row
        label="Taken"
        value={exif.takenAt ? new Date(exif.takenAt).toLocaleDateString() : null}
      />
    </div>
  );
}
