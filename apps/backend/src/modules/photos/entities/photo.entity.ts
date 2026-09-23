import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { ContentStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Album } from '../../albums/entities/album.entity';
import { Collection } from '../../collections/entities/collection.entity';
import { Like } from './like.entity';
import { Bookmark } from './bookmark.entity';
import { Comment } from './comment.entity';

@Entity('photos')
@Index('idx_photos_status_published', ['status', 'publishedAt'])
@Index('idx_photos_photographer', ['photographerId'])
@Index('idx_photos_category', ['categoryId'])
@Index('idx_photos_album', ['albumId'])
export class Photo extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Index('uq_photos_slug', { unique: true })
  @Column({ type: 'varchar', length: 160 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Long-form "story behind the image" narrative. */
  @Column({ type: 'text', nullable: true })
  story!: string | null;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  // ----- dimensions -----
  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ name: 'aspect_ratio', type: 'real', default: 1 })
  aspectRatio!: number;

  // ----- storage keys (S3 object keys, resolved to URLs at serialization time) -----
  @Column({ name: 'storage_key', type: 'text' })
  storageKey!: string;

  @Column({ name: 'thumbnail_key', type: 'text', nullable: true })
  thumbnailKey!: string | null;

  @Column({ name: 'webp_key', type: 'text', nullable: true })
  webpKey!: string | null;

  @Column({ name: 'avif_key', type: 'text', nullable: true })
  avifKey!: string | null;

  /** Base64 LQIP blur placeholder for progressive loading. */
  @Column({ name: 'blur_data_url', type: 'text', nullable: true })
  blurDataUrl!: string | null;

  // ----- EXIF (normalized hot fields + raw bag) -----
  @Column({ name: 'camera_make', type: 'varchar', length: 120, nullable: true })
  cameraMake!: string | null;

  @Column({ name: 'camera_model', type: 'varchar', length: 120, nullable: true })
  cameraModel!: string | null;

  @Column({ name: 'lens_model', type: 'varchar', length: 160, nullable: true })
  lensModel!: string | null;

  @Column({ type: 'int', nullable: true })
  iso!: number | null;

  @Column({ name: 'shutter_speed', type: 'varchar', length: 32, nullable: true })
  shutterSpeed!: string | null;

  @Column({ type: 'real', nullable: true })
  aperture!: number | null;

  @Column({ name: 'focal_length', type: 'real', nullable: true })
  focalLength!: number | null;

  @Column({ name: 'taken_at', type: 'timestamptz', nullable: true })
  takenAt!: Date | null;

  @Column({ name: 'gps_latitude', type: 'double precision', nullable: true })
  gpsLatitude!: number | null;

  @Column({ name: 'gps_longitude', type: 'double precision', nullable: true })
  gpsLongitude!: number | null;

  @Column({ name: 'exif_raw', type: 'jsonb', nullable: true })
  exifRaw!: Record<string, unknown> | null;

  // ----- denormalized counters (kept in sync by services) -----
  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount!: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount!: number;

  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount!: number;

  @Column({ name: 'shares_count', type: 'int', default: 0 })
  sharesCount!: number;

  /** Human-readable capture location, for location search (GPS lives in EXIF cols). */
  @Column({ name: 'location_name', type: 'varchar', length: 200, nullable: true })
  locationName!: string | null;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  // ----- ownership & taxonomy (multi-photographer ready) -----
  @Column({ name: 'photographer_id', type: 'uuid' })
  photographerId!: string;

  @ManyToOne(() => User, (user) => user.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photographer_id' })
  photographer!: User;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, (category) => category.photos, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ name: 'album_id', type: 'uuid', nullable: true })
  albumId!: string | null;

  @ManyToOne(() => Album, (album) => album.photos, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'album_id' })
  album!: Album | null;

  @ManyToMany(() => Collection, (collection) => collection.photos)
  collections!: Collection[];

  @OneToMany(() => Like, (like) => like.photo)
  likes!: Like[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.photo)
  bookmarks!: Bookmark[];

  @OneToMany(() => Comment, (comment) => comment.photo)
  comments!: Comment[];
}
