import { Column, Entity, Index } from 'typeorm';
import { ShareChannel, ShareTargetType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Records a share action for analytics + share counts (polymorphic target). */
@Entity('share_events')
@Index('idx_share_events_target', ['targetType', 'targetId'])
export class ShareEvent extends BaseEntity {
  @Column({ name: 'target_type', type: 'enum', enum: ShareTargetType })
  targetType!: ShareTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId!: string;

  @Column({ type: 'enum', enum: ShareChannel, default: ShareChannel.LINK })
  channel!: ShareChannel;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;
}
