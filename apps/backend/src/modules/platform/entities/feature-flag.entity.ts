import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Runtime feature toggle with optional percentage rollout. */
@Entity('feature_flags')
export class FeatureFlag extends BaseEntity {
  @Index('uq_feature_flags_key', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** 0–100; when enabled, deterministically rolls out to this % of users. */
  @Column({ name: 'rollout_percentage', type: 'int', default: 100 })
  rolloutPercentage!: number;
}
