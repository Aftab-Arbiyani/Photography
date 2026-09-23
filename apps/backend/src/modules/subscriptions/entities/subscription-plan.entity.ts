import { Column, Entity, Index } from 'typeorm';
import { SubscriptionInterval } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';

/** A purchasable membership tier (e.g. free, premium-monthly, premium-yearly). */
@Entity('subscription_plans')
export class SubscriptionPlan extends BaseEntity {
  @Index('uq_subscription_plans_code', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'price_cents', type: 'int', default: 0 })
  priceCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency!: string;

  @Column({ type: 'enum', enum: SubscriptionInterval, default: SubscriptionInterval.MONTH })
  interval!: SubscriptionInterval;

  /** Marketing feature bullet points. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  features!: string[];

  /** True if this plan grants premium entitlements. */
  @Column({ name: 'is_premium', type: 'boolean', default: false })
  isPremium!: boolean;

  @Column({ name: 'stripe_price_id', type: 'varchar', length: 255, nullable: true })
  stripePriceId!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
