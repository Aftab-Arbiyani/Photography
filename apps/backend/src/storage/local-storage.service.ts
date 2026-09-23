import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import type { AppConfig } from '../config/configuration';
import { StorageService, StoredObject } from './storage.service';

/**
 * Local-disk storage adapter used when S3 is not configured (dev / CI).
 * Files are written under `<cwd>/uploads` and served via the backend's static
 * `/uploads` route. Keeps the upload pipeline fully functional without AWS.
 */
@Injectable()
export class LocalStorageService extends StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly root = join(process.cwd(), 'uploads');
  private readonly baseUrl: string;

  constructor(configService: ConfigService) {
    super();
    const app = configService.getOrThrow<AppConfig>('app');
    this.baseUrl = `http://localhost:${app.port}/${app.globalPrefix}/${app.apiVersion}/uploads`;
    this.logger.warn('S3 not configured — using local-disk storage adapter.');
  }

  async upload(key: string, body: Buffer, _contentType: string): Promise<StoredObject> {
    const path = join(this.root, key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, body);
    return { key, url: this.getPublicUrl(key) };
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(join(this.root, key));
    } catch {
      /* already gone — idempotent */
    }
  }

  async getSignedUploadUrl(key: string): Promise<string> {
    // No signing for local disk — return the eventual public URL.
    return this.getPublicUrl(key);
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    // Local disk cannot truly sign; the URL is the (dev-only) public path.
    return this.getPublicUrl(key);
  }

  async getObject(key: string): Promise<Buffer> {
    return fs.readFile(join(this.root, key));
  }
}
