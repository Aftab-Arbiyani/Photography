/**
 * Storage port (hexagonal architecture). Feature services depend on this
 * abstract class; the module binds either the S3 adapter or the local-disk
 * adapter at runtime based on configuration. Swapping providers never touches
 * business logic.
 */
export interface StoredObject {
  key: string;
  url: string;
}

export abstract class StorageService {
  /** Persist a binary object and return its key + public URL. */
  abstract upload(key: string, body: Buffer, contentType: string): Promise<StoredObject>;

  /** Resolve a stored object key to a publicly servable URL. */
  abstract getPublicUrl(key: string): string;

  /** Remove an object (idempotent). */
  abstract delete(key: string): Promise<void>;

  /** Issue a time-limited signed URL for direct browser upload (optional). */
  abstract getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  /**
   * Issue a time-limited signed URL for downloading a PRIVATE object (purchased
   * deliverables). Optionally forces a download filename via Content-Disposition.
   */
  abstract getSignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
    downloadFileName?: string,
  ): Promise<string>;

  /** Fetch a stored object's bytes (used by the watermark pipeline). */
  abstract getObject(key: string): Promise<Buffer>;
}
