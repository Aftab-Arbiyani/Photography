import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * DB-backed, admin-editable email template. Bodies use {{handlebars-style}}
 * placeholders rendered at send time. Lets ops change copy without a deploy.
 */
@Entity('email_templates')
export class EmailTemplate extends BaseEntity {
  @Index('uq_email_templates_key', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 200 })
  subject!: string;

  @Column({ name: 'html_body', type: 'text' })
  htmlBody!: string;

  /** Declared placeholder names, for the admin UI + validation. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  variables!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
