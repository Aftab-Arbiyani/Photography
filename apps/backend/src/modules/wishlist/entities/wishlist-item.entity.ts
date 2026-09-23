import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Album } from '../../albums/entities/album.entity';
import { User } from '../../users/entities/user.entity';

@Entity('wishlist_items')
@Unique('uq_wishlist_user_album', ['userId', 'albumId'])
@Index('idx_wishlist_user', ['userId'])
export class WishlistItem extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album!: Album;
}
