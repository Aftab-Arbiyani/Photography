import { Column, Entity, Index, OneToMany } from 'typeorm';
import { AuthProvider, UserRole } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Photo } from '../../photos/entities/photo.entity';
import { Album } from '../../albums/entities/album.entity';
import { Comment } from '../../photos/entities/comment.entity';
import { Like } from '../../photos/entities/like.entity';
import { Bookmark } from '../../photos/entities/bookmark.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index('uq_users_email', { unique: true })
  @Column({ type: 'citext' })
  email!: string;

  /** Argon2 hash. Null for OAuth-only accounts. */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash!: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider!: AuthProvider;

  @Index('uq_users_google_id', { unique: true, where: '"google_id" IS NOT NULL' })
  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  googleId!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  // ----- social (Phase 4, denormalized counts) -----
  @Column({ name: 'followers_count', type: 'int', default: 0 })
  followersCount!: number;

  @Column({ name: 'following_count', type: 'int', default: 0 })
  followingCount!: number;

  // ----- relations -----
  @OneToMany(() => Photo, (photo) => photo.photographer)
  photos!: Photo[];

  @OneToMany(() => Album, (album) => album.photographer)
  albums!: Album[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes!: Like[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks!: Bookmark[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  // ----- computed -----
  get displayName(): string {
    const full = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
    return full || this.email.split('@')[0];
  }
}
