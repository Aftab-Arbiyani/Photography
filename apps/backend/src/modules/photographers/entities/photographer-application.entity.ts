import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApplicationStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/** An application by a regular user to become a photographer on the platform. */
@Entity('photographer_applications')
@Index('idx_photographer_applications_status', ['status'])
export class PhotographerApplication extends BaseEntity {
  @Index('idx_photographer_applications_user', ['userId'])
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status!: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  statement!: string | null;

  @Column({ name: 'portfolio_url', type: 'text', nullable: true })
  portfolioUrl!: string | null;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote!: string | null;
}
