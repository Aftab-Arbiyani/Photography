import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Typed key-value platform configuration, editable at runtime by admins. */
@Entity('platform_settings')
export class PlatformSetting extends BaseEntity {
  @Index('uq_platform_settings_key', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'jsonb' })
  value!: unknown;

  @Column({ type: 'varchar', length: 64, default: 'general' })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Whether this setting may be exposed to unauthenticated clients. */
  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;
}
