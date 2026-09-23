import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * A directed follow edge: `follower` follows `following`. Self-follows are blocked
 * by a CHECK constraint; duplicates by the unique pair.
 */
@Entity('follows')
@Unique('uq_follows_pair', ['followerId', 'followingId'])
@Index('idx_follows_following', ['followingId'])
@Check('chk_follows_not_self', '"follower_id" <> "following_id"')
export class Follow extends BaseEntity {
  @Column({ name: 'follower_id', type: 'uuid' })
  followerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower!: User;

  @Column({ name: 'following_id', type: 'uuid' })
  followingId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following!: User;
}
