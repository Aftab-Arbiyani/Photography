import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Photo } from '../../photos/entities/photo.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Index('uq_categories_slug', { unique: true })
  @Column({ type: 'varchar', length: 140 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'cover_photo_id', type: 'uuid', nullable: true })
  coverPhotoId!: string | null;

  @Column({ name: 'photos_count', type: 'int', default: 0 })
  photosCount!: number;

  @OneToMany(() => Photo, (photo) => photo.category)
  photos!: Photo[];
}
