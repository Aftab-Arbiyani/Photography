import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AssetType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Album } from './album.entity';

/**
 * A digital deliverable gated behind purchase (high-res, ZIP, exclusive, RAW).
 * `storageKey` points at a PRIVATE bucket object — never exposed publicly; access
 * is only ever via a short-lived signed URL after entitlement verification.
 */
@Entity('album_assets')
@Index('idx_album_assets_album', ['albumId'])
export class AlbumAsset extends BaseEntity {
  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album!: Album;

  @Column({ type: 'enum', enum: AssetType, default: AssetType.HIGH_RES })
  type!: AssetType;

  @Column({ name: 'storage_key', type: 'text' })
  storageKey!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({
    name: 'content_type',
    type: 'varchar',
    length: 120,
    default: 'application/octet-stream',
  })
  contentType!: string;

  @Column({ name: 'size_bytes', type: 'bigint', default: 0 })
  sizeBytes!: number;

  /** True for RAW deliverables — only entitlements whose tier includesRaw may fetch. */
  @Column({ name: 'requires_raw', type: 'boolean', default: false })
  requiresRaw!: boolean;

  /** Whether watermarking should be applied per-image on delivery (images only, not ZIP/RAW). */
  @Column({ name: 'watermarkable', type: 'boolean', default: false })
  watermarkable!: boolean;
}
