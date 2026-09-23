import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

/**
 * Base columns shared by every entity:
 * - uuid primary key (opaque, non-enumerable identifiers)
 * - created/updated timestamps (timestamptz)
 * - soft-delete column (deletedAt) — rows are never hard-deleted by default
 * - optimistic-locking version
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @VersionColumn({ default: 1 })
  version!: number;
}
