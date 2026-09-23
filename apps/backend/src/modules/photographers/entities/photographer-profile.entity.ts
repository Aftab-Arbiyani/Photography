import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { PayoutMethod, VerificationStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Extended profile for an approved photographer: verification, commission and
 * payout settings. One-to-one with User. `commissionRate` is the PLATFORM's cut
 * (0..1); the photographer nets (1 - commissionRate) of each sale.
 */
@Entity('photographer_profiles')
export class PhotographerProfile extends BaseEntity {
  @Index('uq_photographer_profiles_user', { unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 160, nullable: true })
  headline!: string | null;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.UNVERIFIED })
  verificationStatus!: VerificationStatus;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  /** Platform commission rate (0..1). Default 30% platform / 70% photographer. */
  @Column({ name: 'commission_rate', type: 'numeric', precision: 4, scale: 3, default: 0.3 })
  commissionRate!: number;

  @Column({ name: 'payout_method', type: 'enum', enum: PayoutMethod, nullable: true })
  payoutMethod!: PayoutMethod | null;

  /** Opaque payout connection details (e.g. Stripe Connect account id). */
  @Column({ name: 'payout_details', type: 'jsonb', nullable: true })
  payoutDetails!: Record<string, unknown> | null;

  /** Stripe Connect (Express) account id, set during payout onboarding. */
  @Column({ name: 'stripe_account_id', type: 'varchar', length: 255, nullable: true })
  stripeAccountId!: string | null;

  @Column({ name: 'paid_out_cents', type: 'bigint', default: 0 })
  paidOutCents!: number;
}
