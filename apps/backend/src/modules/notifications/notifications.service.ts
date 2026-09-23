import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { type NotificationType, type Paginated, type PublicNotification } from '@photography/types';
import { normalizePagination, paginate } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RedisService } from '../../redis/redis.service';
import { Notification } from './entities/notification.entity';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
}

/** Redis pub/sub channel a user's realtime notifications are published on. */
export const notificationChannel = (userId: string): string => `notif:${userId}`;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly redis: RedisService,
  ) {}

  private toPublic(n: Notification): PublicNotification {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    };
  }

  /** Internal: emit a notification (called by orders/downloads/social). Never throws into a flow. */
  async emit(data: CreateNotificationData): Promise<void> {
    const saved = await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        linkUrl: data.linkUrl ?? null,
      }),
    );
    // Realtime fan-out (best-effort) — SSE/WebSocket subscribers receive it live.
    try {
      await this.redis.raw.publish(
        notificationChannel(saved.userId),
        JSON.stringify(this.toPublic(saved)),
      );
    } catch {
      /* realtime delivery is non-critical; the row is already persisted */
    }
  }

  async list(userId: string, query: PaginationQueryDto): Promise<Paginated<PublicNotification>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [rows, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      rows.map((n) => this.toPublic(n)),
      total,
      page,
      limit,
    );
  }

  unreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({ where: { userId, readAt: IsNull() } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.update(
      { id, userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    if (!result.affected) throw new NotFoundException('Notification not found');
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId, readAt: IsNull() }, { readAt: new Date() });
  }
}
