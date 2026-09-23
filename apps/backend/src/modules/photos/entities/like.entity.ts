import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Photo } from './photo.entity';

@Entity('likes')
@Unique('uq_likes_user_photo', ['userId', 'photoId'])
@Index('idx_likes_photo', ['photoId'])
export class Like extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'photo_id', type: 'uuid' })
  photoId!: string;

  @ManyToOne(() => Photo, (photo) => photo.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo!: Photo;
}
