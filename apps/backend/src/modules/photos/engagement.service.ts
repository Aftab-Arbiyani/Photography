import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CommentStatus,
  ContentStatus,
  NotificationType,
  type Paginated,
  type PublicComment,
  UserRole,
} from '@photography/types';
import { displayName, normalizePagination, paginate } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { NotificationsService } from '../notifications/notifications.service';
import { Bookmark } from './entities/bookmark.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { Photo } from './entities/photo.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

/** Likes, bookmarks and comments. Keeps denormalized counters on Photo in sync. */
@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Like) private readonly likeRepository: Repository<Like>,
    @InjectRepository(Bookmark) private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  private async assertPublishedPhoto(photoId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });
    if (!photo || photo.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Photo not found');
    }
  }

  // ---------- likes ----------

  async like(photoId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    await this.assertPublishedPhoto(photoId);
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Like, { where: { photoId, userId } });
      if (existing) {
        const photo = await manager.findOneByOrFail(Photo, { id: photoId });
        return { liked: true, likesCount: photo.likesCount };
      }
      await manager.insert(Like, { photoId, userId });
      await manager.increment(Photo, { id: photoId }, 'likesCount', 1);
      const photo = await manager.findOneByOrFail(Photo, { id: photoId });
      return { liked: true, likesCount: photo.likesCount };
    });
  }

  async unlike(photoId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.delete(Like, { photoId, userId });
      if (result.affected) {
        await manager.decrement(Photo, { id: photoId }, 'likesCount', 1);
      }
      const photo = await manager.findOneByOrFail(Photo, { id: photoId });
      return { liked: false, likesCount: photo.likesCount };
    });
  }

  // ---------- bookmarks ----------

  async bookmark(photoId: string, userId: string): Promise<{ bookmarked: boolean }> {
    await this.assertPublishedPhoto(photoId);
    const existing = await this.bookmarkRepository.findOne({ where: { photoId, userId } });
    if (!existing) {
      await this.bookmarkRepository.insert({ photoId, userId });
    }
    return { bookmarked: true };
  }

  async unbookmark(photoId: string, userId: string): Promise<{ bookmarked: boolean }> {
    await this.bookmarkRepository.delete({ photoId, userId });
    return { bookmarked: false };
  }

  // ---------- comments ----------

  async addComment(photoId: string, userId: string, dto: CreateCommentDto): Promise<PublicComment> {
    await this.assertPublishedPhoto(photoId);

    if (dto.parentId) {
      const parent = await this.commentRepository.findOne({ where: { id: dto.parentId, photoId } });
      if (!parent) throw new NotFoundException('Parent comment not found');
    }

    const comment = await this.dataSource.transaction(async (manager) => {
      const created = manager.create(Comment, {
        photoId,
        authorId: userId,
        body: dto.body,
        parentId: dto.parentId ?? null,
        status: CommentStatus.VISIBLE,
      });
      const saved = await manager.save(created);
      await manager.increment(Photo, { id: photoId }, 'commentsCount', 1);
      return saved;
    });

    const withAuthor = await this.commentRepository.findOneOrFail({
      where: { id: comment.id },
      relations: { author: true },
    });

    await this.notifyOnComment(withAuthor);
    return this.toPublicComment(withAuthor);
  }

  /** Notify the photo owner of a new comment, and the parent author of a reply. */
  private async notifyOnComment(comment: Comment): Promise<void> {
    const actor = comment.author
      ? displayName(comment.author.firstName, comment.author.lastName, comment.author.email)
      : 'Someone';
    const photo = await this.photoRepository.findOne({ where: { id: comment.photoId } });
    const link = photo ? `/photos/${photo.slug}` : null;

    if (photo && photo.photographerId !== comment.authorId) {
      await this.notifications.emit({
        userId: photo.photographerId,
        type: NotificationType.NEW_COMMENT,
        title: 'New comment on your photo',
        body: `${actor} commented on “${photo.title}”.`,
        linkUrl: link,
      });
    }

    if (comment.parentId) {
      const parent = await this.commentRepository.findOne({ where: { id: comment.parentId } });
      if (
        parent &&
        parent.authorId !== comment.authorId &&
        parent.authorId !== photo?.photographerId
      ) {
        await this.notifications.emit({
          userId: parent.authorId,
          type: NotificationType.NEW_REPLY,
          title: 'New reply to your comment',
          body: `${actor} replied to your comment.`,
          linkUrl: link,
        });
      }
    }
  }

  async listComments(
    photoId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<PublicComment>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { photoId, status: CommentStatus.VISIBLE },
      relations: { author: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      comments.map((c) => this.toPublicComment(c)),
      total,
      page,
      limit,
    );
  }

  async deleteComment(commentId: string, user: RequestUser): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (user.role !== UserRole.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You cannot delete this comment');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Comment, { id: commentId });
      await manager.decrement(Photo, { id: comment.photoId }, 'commentsCount', 1);
    });
  }

  private toPublicComment(c: Comment): PublicComment {
    return {
      id: c.id,
      photoId: c.photoId,
      body: c.body,
      authorId: c.authorId,
      authorDisplayName: c.author
        ? displayName(c.author.firstName, c.author.lastName, c.author.email)
        : 'Unknown',
      authorAvatarUrl: c.author?.avatarUrl ?? null,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
