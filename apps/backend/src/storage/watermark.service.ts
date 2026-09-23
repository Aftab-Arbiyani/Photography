import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

/**
 * Visible watermarking via sharp + SVG overlays.
 *  - preview watermark: repeated diagonal brand text across the image (public previews)
 *  - buyer watermark: subtle buyer-email stamp baked into delivered downloads (forensic trace)
 *
 * Invisible/steganographic watermarking is implemented via LSB embedding in the
 * blue channel of the raw pixel buffer (see {@link applyInvisibleWatermark} /
 * {@link extractInvisibleWatermark}) — a forensic trace that survives re-saving
 * as long as the image stays lossless (PNG).
 */
@Injectable()
export class WatermarkService {
  private readonly logger = new Logger(WatermarkService.name);

  /** 16-bit magic marking the start of an embedded payload. */
  private static readonly MAGIC = 0xa5c3;

  private escapeXml(text: string): string {
    return text.replace(
      /[<>&'"]/g,
      (c) =>
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
    );
  }

  /** Tiled, semi-transparent diagonal brand text — for public preview images. */
  async applyPreviewWatermark(input: Buffer, text: string): Promise<Buffer> {
    try {
      const image = sharp(input);
      const { width = 1200, height = 800 } = await image.metadata();
      const safe = this.escapeXml(text);
      const fontSize = Math.max(18, Math.round(width / 24));

      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wm" width="${width / 2}" height="${height / 3}" patternUnits="userSpaceOnUse"
                     patternTransform="rotate(-30)">
              <text x="0" y="${fontSize}" font-family="sans-serif" font-size="${fontSize}"
                    fill="rgba(255,255,255,0.22)" font-weight="600">${safe}</text>
            </pattern>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#wm)" />
        </svg>`;

      return await image.composite([{ input: Buffer.from(svg), gravity: 'northwest' }]).toBuffer();
    } catch (error) {
      this.logger.warn(`Preview watermark failed: ${(error as Error).message}`);
      return input;
    }
  }

  /** Subtle buyer-email stamp in the lower-left — baked into delivered files. */
  async applyBuyerWatermark(input: Buffer, buyerEmail: string): Promise<Buffer> {
    try {
      const image = sharp(input);
      const { width = 1200, height = 800 } = await image.metadata();
      const stamp = this.escapeXml(`Licensed to ${buyerEmail}`);
      const fontSize = Math.max(12, Math.round(width / 70));

      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <text x="${fontSize}" y="${height - fontSize}" font-family="sans-serif"
                font-size="${fontSize}" fill="rgba(255,255,255,0.45)"
                stroke="rgba(0,0,0,0.25)" stroke-width="0.5">${stamp}</text>
        </svg>`;

      return await image.composite([{ input: Buffer.from(svg), gravity: 'northwest' }]).toBuffer();
    } catch (error) {
      this.logger.warn(`Buyer watermark failed: ${(error as Error).message}`);
      return input;
    }
  }

  /**
   * Embed an invisible forensic payload (e.g. buyer id) into the image using
   * least-significant-bit steganography on the blue channel. Output is PNG so
   * the embedded bits survive (lossy formats would destroy them). On any error
   * or insufficient capacity, returns the input unchanged (never throws).
   *
   * Layout (bit stream, MSB-first per byte): [16-bit MAGIC][32-bit length][payload bytes].
   */
  async applyInvisibleWatermark(input: Buffer, payload: string): Promise<Buffer> {
    try {
      const { data, info } = await sharp(input)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const bytes = Buffer.from(payload, 'utf8');
      const header = Buffer.alloc(6);
      header.writeUInt16BE(WatermarkService.MAGIC, 0);
      header.writeUInt32BE(bytes.length, 2);
      const message = Buffer.concat([header, bytes]);
      const totalBits = message.length * 8;

      const pixels = info.width * info.height; // one bit per pixel (blue channel)
      if (totalBits > pixels) {
        this.logger.warn(
          `Invisible watermark skipped: payload (${totalBits} bits) exceeds capacity (${pixels})`,
        );
        return input;
      }

      const channels = info.channels; // 4 (RGBA after ensureAlpha)
      for (let bit = 0; bit < totalBits; bit += 1) {
        const byte = message[bit >> 3];
        const value = (byte >> (7 - (bit & 7))) & 1;
        const blueIndex = bit * channels + 2;
        data[blueIndex] = (data[blueIndex] & 0xfe) | value;
      }

      return await sharp(data, { raw: { width: info.width, height: info.height, channels } })
        .png()
        .toBuffer();
    } catch (error) {
      this.logger.warn(`Invisible watermark failed: ${(error as Error).message}`);
      return input;
    }
  }

  /** Recover an embedded payload from {@link applyInvisibleWatermark}, or null if absent. */
  async extractInvisibleWatermark(input: Buffer): Promise<string | null> {
    try {
      const { data, info } = await sharp(input)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const channels = info.channels;
      const readBits = (offsetBits: number, count: number): number => {
        let acc = 0;
        for (let i = 0; i < count; i += 1) {
          const blueIndex = (offsetBits + i) * channels + 2;
          acc = (acc << 1) | (data[blueIndex] & 1);
        }
        return acc >>> 0;
      };

      if (readBits(0, 16) !== WatermarkService.MAGIC) return null;
      const length = readBits(16, 32);
      const capacityBytes = Math.floor((info.width * info.height) / 8);
      if (length <= 0 || length > capacityBytes) return null;

      const out = Buffer.alloc(length);
      for (let b = 0; b < length; b += 1) out[b] = readBits(48 + b * 8, 8);
      return out.toString('utf8');
    } catch {
      return null;
    }
  }
}
