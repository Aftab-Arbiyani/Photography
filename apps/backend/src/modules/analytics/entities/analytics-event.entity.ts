import { Column, Entity, Index } from 'typeorm';
import { AnalyticsEventType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Lightweight analytics event. `visitorId` is an anonymous client id (cookie/localStorage)
 * enabling visitor + returning-user metrics without PII; `userId` is set when authenticated.
 */
@Entity('analytics_events')
@Index('idx_analytics_type_created', ['type', 'createdAt'])
@Index('idx_analytics_visitor', ['visitorId'])
export class AnalyticsEvent extends BaseEntity {
  @Column({ type: 'enum', enum: AnalyticsEventType })
  type!: AnalyticsEventType;

  @Column({ name: 'visitor_id', type: 'varchar', length: 64, nullable: true })
  visitorId!: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  path!: string | null;

  /** Normalized search term (lowercased) when type=search — powers "top searches". */
  @Column({ name: 'query', type: 'varchar', length: 255, nullable: true })
  query!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  referrer!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
