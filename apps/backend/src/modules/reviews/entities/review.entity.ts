import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ReviewStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Album } from '../../albums/entities/album.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
@Unique('uq_reviews_user_album', ['userId', 'albumId'])
@Index('idx_reviews_album', ['albumId'])
@Check('chk_reviews_rating', 'rating >= 1 AND rating <= 5')
export class Review extends BaseEntity {
  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album!: Album;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'varchar', length: 160, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PUBLISHED })
  status!: ReviewStatus;

  /** True when the reviewer has a paid entitlement for the album. */
  @Column({ name: 'is_verified_purchase', type: 'boolean', default: false })
  isVerifiedPurchase!: boolean;
}
