import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CommentStatus } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Photo } from './photo.entity';

@Entity('comments')
@Index('idx_comments_photo', ['photoId'])
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'enum', enum: CommentStatus, default: CommentStatus.VISIBLE })
  status!: CommentStatus;

  @Column({ name: 'photo_id', type: 'uuid' })
  photoId!: string;

  @ManyToOne(() => Photo, (photo) => photo.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo!: Photo;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  /** Self-referencing for single-level threaded replies. */
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies!: Comment[];
}
