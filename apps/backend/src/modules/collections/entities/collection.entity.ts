import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { ContentStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Photo } from '../../photos/entities/photo.entity';
import { User } from '../../users/entities/user.entity';

/**
 * A curated grouping of photos that can span albums and photographers.
 * Many-to-many with Photo via the `collection_photos` join table.
 */
@Entity('collections')
export class Collection extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Index('uq_collections_slug', { unique: true })
  @Column({ type: 'varchar', length: 220 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  @Column({ name: 'cover_photo_id', type: 'uuid', nullable: true })
  coverPhotoId!: string | null;

  @Column({ name: 'is_curated', type: 'boolean', default: false })
  isCurated!: boolean;

  @Column({ name: 'photos_count', type: 'int', default: 0 })
  photosCount!: number;

  @Column({ name: 'curator_id', type: 'uuid', nullable: true })
  curatorId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'curator_id' })
  curator!: User | null;

  @ManyToMany(() => Photo, (photo) => photo.collections, { cascade: false })
  @JoinTable({
    name: 'collection_photos',
    joinColumn: { name: 'collection_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'photo_id', referencedColumnName: 'id' },
  })
  photos!: Photo[];
}
