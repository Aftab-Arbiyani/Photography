import { FileValidator } from '@nestjs/common';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/heic',
  'image/heif',
]);

/**
 * Validates that an uploaded file is a supported raster image by MIME type.
 * Used inside ParseFilePipe alongside MaxFileSizeValidator.
 */
export class ImageFileValidator extends FileValidator {
  isValid(file?: Express.Multer.File): boolean {
    return !!file && ALLOWED_MIME.has(file.mimetype);
  }

  buildErrorMessage(): string {
    return `Unsupported image type. Allowed: ${[...ALLOWED_MIME].join(', ')}`;
  }
}
