import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageConfig } from '../config/configuration';
import { StorageService, StoredObject } from './storage.service';

/** AWS S3 (or S3-compatible: MinIO / LocalStack) storage adapter. */
@Injectable()
export class S3StorageService extends StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly cfg: StorageConfig;

  constructor(configService: ConfigService) {
    super();
    this.cfg = configService.getOrThrow<StorageConfig>('storage');
    this.client = new S3Client({
      region: this.cfg.region,
      endpoint: this.cfg.endpoint || undefined,
      forcePathStyle: this.cfg.forcePathStyle,
      credentials: {
        accessKeyId: this.cfg.accessKeyId,
        secretAccessKey: this.cfg.secretAccessKey,
      },
    });
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return { key, url: this.getPublicUrl(key) };
  }

  getPublicUrl(key: string): string {
    if (this.cfg.publicUrl) {
      return `${this.cfg.publicUrl.replace(/\/$/, '')}/${key}`;
    }
    if (this.cfg.endpoint) {
      return `${this.cfg.endpoint.replace(/\/$/, '')}/${this.cfg.bucket}/${key}`;
    }
    return `https://${this.cfg.bucket}.s3.${this.cfg.region}.amazonaws.com/${key}`;
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
    } catch (error) {
      this.logger.warn(`Failed to delete ${key}: ${(error as Error).message}`);
    }
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.cfg.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 300,
    downloadFileName?: string,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.cfg.bucket,
      Key: key,
      ResponseContentDisposition: downloadFileName
        ? `attachment; filename="${downloadFileName.replace(/"/g, '')}"`
        : undefined,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getObject(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Empty object: ${key}`);
    return Buffer.from(bytes);
  }
}
