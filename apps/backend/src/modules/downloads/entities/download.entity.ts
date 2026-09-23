import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AlbumAsset } from '../../albums/entities/album-asset.entity';
import { Entitlement } from '../../orders/entities/entitlement.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Audit record for every signed-download issuance: who, what, when, from where.
 * Backs download history, IP/device tracking, audit logs and hotlink forensics.
 */
@Entity('downloads')
@Index('idx_downloads_user', ['userId'])
@Index('idx_downloads_entitlement', ['entitlementId'])
export class Download extends BaseEntity {
  @Column({ name: 'entitlement_id', type: 'uuid' })
  entitlementId!: string;

  @ManyToOne(() => Entitlement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entitlement_id' })
  entitlement!: Entitlement;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @ManyToOne(() => AlbumAsset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset!: AlbumAsset;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  /** Client-supplied device fingerprint hash (best-effort device tracking). */
  @Column({ name: 'device_fingerprint', type: 'varchar', length: 128, nullable: true })
  deviceFingerprint!: string | null;

  @Column({ name: 'signed_url_expires_at', type: 'timestamptz' })
  signedUrlExpiresAt!: Date;

  @Column({ name: 'watermarked', type: 'boolean', default: false })
  watermarked!: boolean;
}
