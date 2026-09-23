import { Column, Entity, Index } from 'typeorm';
import { CouponType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Index('uq_coupons_code', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'enum', enum: CouponType, default: CouponType.PERCENT })
  type!: CouponType;

  /** percent (0–100) when type=percent, else fixed amount in cents. */
  @Column({ type: 'int' })
  value!: number;

  @Column({ name: 'min_subtotal_cents', type: 'int', default: 0 })
  minSubtotalCents!: number;

  @Column({ name: 'max_redemptions', type: 'int', nullable: true })
  maxRedemptions!: number | null;

  @Column({ name: 'redeemed_count', type: 'int', default: 0 })
  redeemedCount!: number;

  @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
  validFrom!: Date | null;

  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
  validUntil!: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
