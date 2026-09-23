import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  AnalyticsEventType,
  type AnalyticsDashboard,
  ContentStatus,
  OrderStatus,
  type TimeseriesPoint,
  type TopItem,
} from '@photography/types';
import type { CommerceConfig } from '../../config/configuration';
import { Album } from '../albums/entities/album.entity';
import { Photo } from '../photos/entities/photo.entity';
import { Order } from '../orders/entities/order.entity';
import { Download } from '../downloads/entities/download.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';

export interface RecordEventInput {
  type: AnalyticsEventType;
  visitorId?: string | null;
  userId?: string | null;
  path?: string | null;
  query?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly currency: string;

  constructor(
    @InjectRepository(AnalyticsEvent) private readonly eventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(Download) private readonly downloadRepository: Repository<Download>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    configService: ConfigService,
  ) {
    this.currency = configService.getOrThrow<CommerceConfig>('commerce').currency;
  }

  /** Fire-and-forget event capture (never throws into a request flow). */
  async record(input: RecordEventInput): Promise<void> {
    try {
      await this.eventRepository.save(
        this.eventRepository.create({
          type: input.type,
          visitorId: input.visitorId ?? null,
          userId: input.userId ?? null,
          path: input.path ?? null,
          query: input.query ? input.query.toLowerCase().slice(0, 255) : null,
          referrer: input.referrer ?? null,
          metadata: input.metadata ?? null,
        }),
      );
    } catch (error) {
      this.logger.warn(`analytics record failed: ${(error as Error).message}`);
    }
  }

  recordSearch(query: string, visitorId?: string | null, userId?: string | null): Promise<void> {
    return this.record({ type: AnalyticsEventType.SEARCH, query, visitorId, userId });
  }

  // ---------------- admin dashboard ----------------

  async dashboard(fromIso?: string, toIso?: string): Promise<AnalyticsDashboard> {
    const to = toIso ? new Date(toIso) : new Date();
    const from = fromIso ? new Date(fromIso) : new Date(to.getTime() - 30 * 86_400_000);
    const range = Between(from, to);

    const [
      visitors,
      returningUsers,
      pageviews,
      sales,
      downloads,
      popularPhotos,
      popularAlbums,
      topSearches,
      revenueGraph,
      visitorsGraph,
    ] = await Promise.all([
      this.distinctVisitors(from, to),
      this.returningVisitors(from, to),
      this.eventRepository.count({
        where: { type: AnalyticsEventType.PAGEVIEW, createdAt: range },
      }),
      this.salesSummary(from, to),
      this.downloadRepository.count({ where: { createdAt: range } }),
      this.popularPhotos(),
      this.popularAlbums(),
      this.topSearches(from, to),
      this.revenueGraph(from, to),
      this.visitorsGraph(from, to),
    ]);

    const conversionRate = visitors > 0 ? Math.round((sales.count / visitors) * 10000) / 10000 : 0;

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      visitors,
      returningUsers,
      pageviews,
      sales: { count: sales.count, revenueCents: sales.revenueCents, currency: this.currency },
      downloads,
      conversionRate,
      popularPhotos,
      popularAlbums,
      topSearches,
      revenueGraph,
      visitorsGraph,
    };
  }

  private async distinctVisitors(from: Date, to: Date): Promise<number> {
    const { count } = (await this.eventRepository
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.visitor_id)', 'count')
      .where('e.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('e.visitor_id IS NOT NULL')
      .getRawOne<{ count: string }>()) ?? { count: '0' };
    return Number(count);
  }

  /** Visitors active on more than one distinct day in the range. */
  private async returningVisitors(from: Date, to: Date): Promise<number> {
    const rows = await this.eventRepository
      .createQueryBuilder('e')
      .select('e.visitor_id', 'visitor')
      .where('e.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('e.visitor_id IS NOT NULL')
      .groupBy('e.visitor_id')
      .having('COUNT(DISTINCT DATE(e.created_at)) > 1')
      .getRawMany<{ visitor: string }>();
    return rows.length;
  }

  private async salesSummary(
    from: Date,
    to: Date,
  ): Promise<{ count: number; revenueCents: number }> {
    const row = await this.orderRepository
      .createQueryBuilder('o')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.total_cents), 0)', 'revenue')
      .where('o.status = :status', { status: OrderStatus.PAID })
      .andWhere('o.paid_at BETWEEN :from AND :to', { from, to })
      .getRawOne<{ count: string; revenue: string }>();
    return { count: Number(row?.count ?? 0), revenueCents: Number(row?.revenue ?? 0) };
  }

  private async popularPhotos(): Promise<TopItem[]> {
    const photos = await this.photoRepository.find({
      where: { status: ContentStatus.PUBLISHED },
      order: { viewsCount: 'DESC' },
      take: 10,
    });
    return photos.map((p) => ({ id: p.id, label: p.title, value: p.viewsCount }));
  }

  private async popularAlbums(): Promise<TopItem[]> {
    const albums = await this.albumRepository.find({ order: { salesCount: 'DESC' }, take: 10 });
    return albums.map((a) => ({ id: a.id, label: a.title, value: a.salesCount }));
  }

  private async topSearches(from: Date, to: Date): Promise<TopItem[]> {
    const rows = await this.eventRepository
      .createQueryBuilder('e')
      .select('e.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('e.type = :type', { type: AnalyticsEventType.SEARCH })
      .andWhere('e.query IS NOT NULL')
      .andWhere('e.created_at BETWEEN :from AND :to', { from, to })
      .groupBy('e.query')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ query: string; count: string }>();
    return rows.map((r) => ({ id: r.query, label: r.query, value: Number(r.count) }));
  }

  private async revenueGraph(from: Date, to: Date): Promise<TimeseriesPoint[]> {
    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .select("to_char(o.paid_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(o.total_cents), 0)', 'value')
      .where('o.status = :status', { status: OrderStatus.PAID })
      .andWhere('o.paid_at BETWEEN :from AND :to', { from, to })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; value: string }>();
    return rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  }

  private async visitorsGraph(from: Date, to: Date): Promise<TimeseriesPoint[]> {
    const rows = await this.eventRepository
      .createQueryBuilder('e')
      .select("to_char(e.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(DISTINCT e.visitor_id)', 'value')
      .where('e.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('e.visitor_id IS NOT NULL')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; value: string }>();
    return rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  }
}
