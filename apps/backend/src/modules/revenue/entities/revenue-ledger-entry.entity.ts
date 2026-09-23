import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type LedgerEntryType = 'sale' | 'refund';

/**
 * Materialized revenue ledger. One immutable row per order-item revenue event
 * (sale or refund), with the commission split snapshotted at the time of the
 * event. Written at fulfillment/refund and reconciled nightly against
 * order_items — lets revenue reporting scale without live aggregation.
 */
@Entity('revenue_ledger')
@Index('idx_revenue_ledger_photographer', ['photographerId'])
@Index('idx_revenue_ledger_order', ['orderId'])
@Index('uq_revenue_ledger_item_type', ['orderItemId', 'type'], { unique: true })
export class RevenueLedgerEntry extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId!: string;

  @Column({ name: 'photographer_id', type: 'uuid' })
  photographerId!: string;

  @Column({ type: 'varchar', length: 16, default: 'sale' })
  type!: LedgerEntryType;

  /** Signed: positive for sales, negative for refunds. */
  @Column({ name: 'gross_cents', type: 'int' })
  grossCents!: number;

  @Column({ name: 'commission_cents', type: 'int' })
  commissionCents!: number;

  @Column({ name: 'net_cents', type: 'int' })
  netCents!: number;

  @Column({ name: 'commission_rate', type: 'numeric', precision: 5, scale: 4 })
  commissionRate!: string;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency!: string;
}
