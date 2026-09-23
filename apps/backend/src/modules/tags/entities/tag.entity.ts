import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Photo } from '../../photos/entities/photo.entity';

/**
 * A free-form tag. Owns the `photo_tags` join table (one-directional — the Photo
 * entity is left untouched). `usageCount` is denormalized for popular-tag listing.
 */
@Entity('tags')
export class Tag extends BaseEntity {
  @Index('uq_tags_slug', { unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount!: number;

  @ManyToMany(() => Photo, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'photo_tags',
    joinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'photo_id', referencedColumnName: 'id' },
  })
  photos!: Photo[];
}
