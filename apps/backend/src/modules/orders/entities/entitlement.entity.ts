import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { LicenseType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Album } from '../../albums/entities/album.entity';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Grants a user download rights to an album, created when an order is paid.
 * This is the single source of truth for "may this user download this album",
 * decoupled from the order so refunds simply deactivate it.
 */
@Entity('entitlements')
@Index('idx_entitlements_user', ['userId'])
@Index('idx_entitlements_user_album', ['userId', 'albumId'])
export class Entitlement extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album!: Album;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'license_type', type: 'enum', enum: LicenseType })
  licenseType!: LicenseType;

  @Column({ name: 'download_limit', type: 'int', default: 5 })
  downloadLimit!: number;

  @Column({ name: 'downloads_used', type: 'int', default: 0 })
  downloadsUsed!: number;

  @Column({ name: 'includes_raw', type: 'boolean', default: false })
  includesRaw!: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  get downloadsRemaining(): number {
    return Math.max(0, this.downloadLimit - this.downloadsUsed);
  }

  get isUsable(): boolean {
    return (
      this.isActive &&
      this.downloadsRemaining > 0 &&
      (!this.expiresAt || this.expiresAt.getTime() > Date.now())
    );
  }
}
