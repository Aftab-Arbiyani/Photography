import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { NotificationType, type Paginated, type PublicPhotographer } from '@photography/types';
import { displayName, normalizePagination, paginate } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ContentStatus } from '@photography/types';
import { NotificationsService } from '../notifications/notifications.service';
import { Photo } from '../photos/entities/photo.entity';
import { User } from '../users/entities/user.entity';
import { Follow } from './entities/follow.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow) private readonly followRepository: Repository<Follow>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  /** Public photographer profile with social + content counts. */
  async getProfile(userId: string, viewerId?: string): Promise<PublicPhotographer> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Photographer not found');
    const [photosCount, isFollowing] = await Promise.all([
      this.photoRepository.count({
        where: { photographerId: userId, status: ContentStatus.PUBLISHED },
      }),
      viewerId && viewerId !== userId
        ? this.isFollowing(viewerId, userId)
        : Promise.resolve(undefined),
    ]);
    return { ...this.toPhotographer(user, isFollowing), photosCount };
  }

  private toPhotographer(user: User, isFollowing?: boolean): PublicPhotographer {
    const result: PublicPhotographer = {
      id: user.id,
      displayName: displayName(user.firstName, user.lastName, user.email),
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      photosCount: 0,
      ...(isFollowing !== undefined ? { isFollowing } : {}),
    };
    return result;
  }

  async follow(
    followerId: string,
    followingId: string,
  ): Promise<{ following: true; followersCount: number }> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    const target = await this.userRepository.findOne({ where: { id: followingId } });
    if (!target) throw new NotFoundException('Photographer not found');

    const created = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Follow, { where: { followerId, followingId } });
      if (existing) return false;
      await manager.insert(Follow, { followerId, followingId });
      await manager.increment(User, { id: followingId }, 'followersCount', 1);
      await manager.increment(User, { id: followerId }, 'followingCount', 1);
      return true;
    });

    if (created) {
      const follower = await this.userRepository.findOne({ where: { id: followerId } });
      await this.notifications.emit({
        userId: followingId,
        type: NotificationType.NEW_FOLLOWER,
        title: 'New follower',
        body: `${follower ? displayName(follower.firstName, follower.lastName, follower.email) : 'Someone'} started following you.`,
        linkUrl: `/photographers/${followerId}`,
      });
    }

    const fresh = await this.userRepository.findOneByOrFail({ id: followingId });
    return { following: true, followersCount: fresh.followersCount };
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<{ following: false; followersCount: number }> {
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.delete(Follow, { followerId, followingId });
      if (result.affected) {
        await manager.decrement(User, { id: followingId }, 'followersCount', 1);
        await manager.decrement(User, { id: followerId }, 'followingCount', 1);
      }
    });
    const fresh = await this.userRepository.findOneByOrFail({ id: followingId });
    return { following: false, followersCount: fresh.followersCount };
  }

  /** Users who follow `userId`. */
  async followers(
    userId: string,
    query: PaginationQueryDto,
    viewerId?: string,
  ): Promise<Paginated<PublicPhotographer>> {
    return this.listEdge('followers', userId, query, viewerId);
  }

  /** Users `userId` follows. */
  async following(
    userId: string,
    query: PaginationQueryDto,
    viewerId?: string,
  ): Promise<Paginated<PublicPhotographer>> {
    return this.listEdge('following', userId, query, viewerId);
  }

  private async listEdge(
    direction: 'followers' | 'following',
    userId: string,
    query: PaginationQueryDto,
    viewerId?: string,
  ): Promise<Paginated<PublicPhotographer>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where = direction === 'followers' ? { followingId: userId } : { followerId: userId };
    const [edges, total] = await this.followRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    const ids = edges.map((e) => (direction === 'followers' ? e.followerId : e.followingId));
    if (ids.length === 0) return paginate([], total, page, limit);

    const users = await this.userRepository.find({ where: { id: In(ids) } });
    const followingSet = await this.followingSet(viewerId, ids);
    const order = new Map(ids.map((id, i) => [id, i]));
    const items = users
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((u) => this.toPhotographer(u, viewerId ? followingSet.has(u.id) : undefined));
    return paginate(items, total, page, limit);
  }

  /** Which of `targetIds` the viewer already follows (for isFollowing flags). */
  async followingSet(viewerId: string | undefined, targetIds: string[]): Promise<Set<string>> {
    if (!viewerId || targetIds.length === 0) return new Set();
    const rows = await this.followRepository.find({
      where: { followerId: viewerId, followingId: In(targetIds) },
      select: { followingId: true },
    });
    return new Set(rows.map((r) => r.followingId));
  }

  async isFollowing(viewerId: string, targetId: string): Promise<boolean> {
    return (
      (await this.followRepository.count({
        where: { followerId: viewerId, followingId: targetId },
      })) > 0
    );
  }
}
