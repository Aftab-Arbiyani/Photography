import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Append-only audit trail of state-changing actions. Populated automatically by
 * the global AuditInterceptor for authenticated mutations, and explicitly for
 * sensitive operations (refunds, moderation, role changes).
 */
@Entity('audit_logs')
@Index('idx_audit_actor', ['actorId', 'createdAt'])
@Index('idx_audit_entity', ['entityType', 'entityId'])
export class AuditLog extends BaseEntity {
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  /** e.g. "POST /api/v1/payments/refund/:id" or a domain verb like "report.resolve". */
  @Column({ type: 'varchar', length: 160 })
  action!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 80, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 64, nullable: true })
  entityId!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
