import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ContentStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Photo } from '../../photos/entities/photo.entity';
import { User } from '../../users/entities/user.entity';

@Entity('albums')
@Index('idx_albums_photographer', ['photographerId'])
export class Album extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Index('uq_albums_slug', { unique: true })
  @Column({ type: 'varchar', length: 220 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  @Column({ name: 'cover_photo_id', type: 'uuid', nullable: true })
  coverPhotoId!: string | null;

  @Column({ name: 'photos_count', type: 'int', default: 0 })
  photosCount!: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  // ----- marketplace (Phase 3, additive) -----
  @Column({ name: 'is_for_sale', type: 'boolean', default: false })
  isForSale!: boolean;

  @Index('idx_albums_featured', ['isFeatured'])
  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'trailer_url', type: 'text', nullable: true })
  trailerUrl!: string | null;

  /** Album-level discount applied on top of every pricing tier (0–100). */
  @Column({ name: 'discount_percent', type: 'int', default: 0 })
  discountPercent!: number;

  @Column({ name: 'discount_active', type: 'boolean', default: false })
  discountActive!: boolean;

  @Column({ name: 'rating_average', type: 'numeric', precision: 3, scale: 2, default: 0 })
  ratingAverage!: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @Column({ name: 'sales_count', type: 'int', default: 0 })
  salesCount!: number;

  @Column({ name: 'photographer_id', type: 'uuid' })
  photographerId!: string;

  @ManyToOne(() => User, (user) => user.albums, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photographer_id' })
  photographer!: User;

  @OneToMany(() => Photo, (photo) => photo.album)
  photos!: Photo[];
}
