import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ReportReason, ReportStatus, ReportTargetType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Polymorphic abuse/content report. `targetType` + `targetId` reference any
 * reportable entity (photo, album, collection, comment, user) without a hard FK,
 * so moderation stays decoupled from the target's lifecycle.
 */
@Entity('reports')
@Index('idx_reports_status', ['status'])
@Index('idx_reports_target', ['targetType', 'targetId'])
export class Report extends BaseEntity {
  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: User;

  @Column({ name: 'target_type', type: 'enum', enum: ReportTargetType })
  targetType!: ReportTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId!: string;

  @Column({ type: 'enum', enum: ReportReason })
  reason!: ReportReason;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy!: string | null;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote!: string | null;
}
