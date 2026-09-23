import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import ExifReader from 'exif-reader';
import type { PhotoExif } from '@photography/types';
import { formatShutterSpeed } from '@photography/utils';

export interface ProcessedVariant {
  /** suffix appended to the base key, e.g. 'thumb', 'webp', 'avif' */
  variant: string;
  buffer: Buffer;
  contentType: string;
  extension: string;
}

export interface ProcessedImage {
  width: number;
  height: number;
  variants: ProcessedVariant[];
  blurDataUrl: string;
  exif: PhotoExif | null;
}

const THUMBNAIL_WIDTH = 600;
const WEBP_WIDTH = 1600;
const AVIF_WIDTH = 1600;

/**
 * Image pipeline: validates the source, derives thumbnail/WebP/AVIF variants,
 * produces a tiny base64 blur placeholder (LQIP), and extracts normalized EXIF.
 * Pure transformation — persistence is the caller's responsibility.
 */
@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async process(input: Buffer): Promise<ProcessedImage> {
    const image = sharp(input, { failOn: 'error' });
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    const [thumbnail, webp, avif, blurDataUrl] = await Promise.all([
      sharp(input)
        .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer(),
      sharp(input)
        .resize(WEBP_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),
      sharp(input)
        .resize(AVIF_WIDTH, null, { withoutEnlargement: true })
        .avif({ quality: 55 })
        .toBuffer(),
      this.generateBlurPlaceholder(input),
    ]);

    const variants: ProcessedVariant[] = [
      { variant: 'thumb', buffer: thumbnail, contentType: 'image/jpeg', extension: 'jpg' },
      { variant: 'webp', buffer: webp, contentType: 'image/webp', extension: 'webp' },
      { variant: 'avif', buffer: avif, contentType: 'image/avif', extension: 'avif' },
    ];

    return {
      width,
      height,
      variants,
      blurDataUrl,
      exif: this.extractExif(metadata.exif),
    };
  }

  /** 20px-wide blurred WebP encoded as a data URI for instant placeholder rendering. */
  private async generateBlurPlaceholder(input: Buffer): Promise<string> {
    const buffer = await sharp(input)
      .resize(20, null, { withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();
    return `data:image/webp;base64,${buffer.toString('base64')}`;
  }

  private extractExif(exifBuffer?: Buffer): PhotoExif | null {
    if (!exifBuffer) return null;
    try {
      const tags = ExifReader(exifBuffer);
      const image = tags.Image ?? {};
      const photo = tags.Photo ?? {};
      const gps = tags.GPSInfo ?? {};

      const apertureRaw = (photo.FNumber as number | undefined) ?? undefined;
      const shutterRaw = photo.ExposureTime as number | undefined;

      return {
        cameraMake: (image.Make as string | undefined)?.trim() ?? null,
        cameraModel: (image.Model as string | undefined)?.trim() ?? null,
        lensModel: (photo.LensModel as string | undefined)?.trim() ?? null,
        iso: (photo.ISOSpeedRatings as number | undefined) ?? null,
        shutterSpeed: formatShutterSpeed(shutterRaw),
        aperture: apertureRaw ? Math.round(apertureRaw * 10) / 10 : null,
        focalLength: (photo.FocalLength as number | undefined) ?? null,
        takenAt: this.parseExifDate(photo.DateTimeOriginal as Date | string | undefined),
        gpsLatitude: this.parseGps(
          gps.GPSLatitude as number[] | undefined,
          gps.GPSLatitudeRef as string | undefined,
        ),
        gpsLongitude: this.parseGps(
          gps.GPSLongitude as number[] | undefined,
          gps.GPSLongitudeRef as string | undefined,
        ),
        raw: tags as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.warn(`EXIF parse failed: ${(error as Error).message}`);
      return null;
    }
  }

  private parseExifDate(value: Date | string | undefined): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private parseGps(dms: number[] | undefined, ref: string | undefined): number | null {
    if (!dms || dms.length < 3) return null;
    const [deg, min, sec] = dms;
    let decimal = deg + min / 60 + sec / 3600;
    if (ref === 'S' || ref === 'W') decimal = -decimal;
    return Math.round(decimal * 1e6) / 1e6;
  }
}
