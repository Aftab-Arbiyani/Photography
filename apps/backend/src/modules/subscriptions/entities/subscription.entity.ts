import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SubscriptionStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

/** A user's membership subscription to a plan (one active per user). */
@Entity('subscriptions')
@Index('idx_subscriptions_user', ['userId'])
@Index('idx_subscriptions_status', ['status'])
export class Subscription extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan!: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.INCOMPLETE })
  status!: SubscriptionStatus;

  @Index('uq_subscriptions_stripe', { unique: true, where: '"stripe_subscription_id" IS NOT NULL' })
  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId!: string | null;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 255, nullable: true })
  stripeCustomerId!: string | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd!: Date | null;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  get isActiveNow(): boolean {
    if (this.status !== SubscriptionStatus.ACTIVE && this.status !== SubscriptionStatus.TRIALING) {
      return false;
    }
    return !this.currentPeriodEnd || this.currentPeriodEnd.getTime() > Date.now();
  }
}
