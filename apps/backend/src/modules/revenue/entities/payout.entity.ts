import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PayoutMethod, PayoutStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/** A withdrawal of a photographer's available balance. */
@Entity('payouts')
@Index('idx_payouts_photographer', ['photographerId'])
@Index('idx_payouts_status', ['status'])
export class Payout extends BaseEntity {
  @Column({ name: 'photographer_id', type: 'uuid' })
  photographerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photographer_id' })
  photographer!: User;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency!: string;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.REQUESTED })
  status!: PayoutStatus;

  @Column({ type: 'enum', enum: PayoutMethod, default: PayoutMethod.STRIPE })
  method!: PayoutMethod;

  /** External transfer reference (e.g. Stripe transfer id). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  reference!: string | null;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy!: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;
}
