import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { OrderStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index('idx_orders_user', ['userId'])
@Index('idx_orders_status', ['status'])
export class Order extends BaseEntity {
  @Index('uq_orders_invoice_number', { unique: true })
  @Column({ name: 'invoice_number', type: 'varchar', length: 40 })
  invoiceNumber!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  // ----- money (integer minor units) -----
  @Column({ name: 'subtotal_cents', type: 'int', default: 0 })
  subtotalCents!: number;

  @Column({ name: 'discount_cents', type: 'int', default: 0 })
  discountCents!: number;

  @Column({ name: 'coupon_cents', type: 'int', default: 0 })
  couponCents!: number;

  @Column({ name: 'tax_cents', type: 'int', default: 0 })
  taxCents!: number;

  @Column({ name: 'total_cents', type: 'int', default: 0 })
  totalCents!: number;

  @Column({ name: 'refunded_cents', type: 'int', default: 0 })
  refundedCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency!: string;

  @Column({ name: 'coupon_code', type: 'varchar', length: 64, nullable: true })
  couponCode!: string | null;

  @Column({ name: 'billing_email', type: 'varchar', length: 254 })
  billingEmail!: string;

  // ----- Stripe / refund (refund-ready) -----
  @Index('idx_orders_payment_intent', ['stripePaymentIntentId'])
  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ name: 'stripe_charge_id', type: 'varchar', length: 255, nullable: true })
  stripeChargeId!: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt!: Date | null;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt!: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
}
