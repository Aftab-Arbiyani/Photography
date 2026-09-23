import { Column, Entity, Index } from 'typeorm';
import { CmsPageStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Editorial / legal CMS page (about, terms, privacy, …) served by slug. */
@Entity('cms_pages')
export class CmsPage extends BaseEntity {
  @Index('uq_cms_pages_slug', { unique: true })
  @Column({ type: 'varchar', length: 160 })
  slug!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'enum', enum: CmsPageStatus, default: CmsPageStatus.DRAFT })
  status!: CmsPageStatus;

  @Column({ name: 'meta_title', type: 'varchar', length: 200, nullable: true })
  metaTitle!: string | null;

  @Column({ name: 'meta_description', type: 'varchar', length: 320, nullable: true })
  metaDescription!: string | null;
}
