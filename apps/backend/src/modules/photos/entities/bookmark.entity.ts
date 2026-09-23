import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Photo } from './photo.entity';

@Entity('bookmarks')
@Unique('uq_bookmarks_user_photo', ['userId', 'photoId'])
@Index('idx_bookmarks_user', ['userId'])
export class Bookmark extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'photo_id', type: 'uuid' })
  photoId!: string;

  @ManyToOne(() => Photo, (photo) => photo.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo!: Photo;
}
