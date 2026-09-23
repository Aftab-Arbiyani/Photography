import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { LicenseType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Album } from '../../albums/entities/album.entity';
import { Order } from './order.entity';

/**
 * Immutable snapshot of a purchased line. Title/price are denormalized so the
 * order history stays accurate even if the album or its pricing later changes.
 * `photographerId` snapshot makes per-photographer revenue reporting trivial —
 * the multi-photographer payout path is ready without a schema change.
 */
@Entity('order_items')
@Index('idx_order_items_order', ['orderId'])
@Index('idx_order_items_photographer', ['photographerId'])
export class OrderItem extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @ManyToOne(() => Album, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'album_id' })
  album!: Album | null;

  @Column({ name: 'pricing_id', type: 'uuid', nullable: true })
  pricingId!: string | null;

  @Column({ name: 'photographer_id', type: 'uuid' })
  photographerId!: string;

  @Column({ name: 'album_title', type: 'varchar', length: 200 })
  albumTitle!: string;

  @Column({ name: 'pricing_name', type: 'varchar', length: 120 })
  pricingName!: string;

  @Column({ name: 'license_type', type: 'enum', enum: LicenseType })
  licenseType!: LicenseType;

  @Column({ name: 'unit_price_cents', type: 'int' })
  unitPriceCents!: number;

  @Column({ name: 'download_limit', type: 'int', default: 5 })
  downloadLimit!: number;

  @Column({ name: 'includes_raw', type: 'boolean', default: false })
  includesRaw!: boolean;
}
