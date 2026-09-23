import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { DiscoveryService } from '../discovery/discovery.service';
import { QueueService } from '../queue/queue.service';
import { RevenueService } from '../revenue/revenue.service';
import { SeoService } from '../seo/seo.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/**
 * Scheduled platform maintenance. Each job is idempotent and self-contained so
 * it scales horizontally (in a multi-instance deploy, gate with a Redis lock or
 * run on a single worker dyno — see deployment docs).
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly discovery: DiscoveryService,
    private readonly seo: SeoService,
    private readonly subscriptions: SubscriptionsService,
    private readonly revenue: RevenueService,
    private readonly queue: QueueService,
  ) {}

  /** Refresh trending/popular/featured caches every 30 minutes. */
  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'refresh-discovery' })
  async refreshDiscovery(): Promise<void> {
    await this.discovery.invalidate();
    await Promise.all([
      this.discovery.trendingPhotos(),
      this.discovery.popularAlbums(),
      this.discovery.featuredCollections(),
    ]);
    this.logger.log('Discovery caches refreshed');
  }

  /** Rebuild the sitemap hourly so it reflects newly-published content. */
  @Cron(CronExpression.EVERY_HOUR, { name: 'refresh-sitemap' })
  async refreshSitemap(): Promise<void> {
    await this.seo.invalidate();
    await this.seo.getSitemap();
    this.logger.log('Sitemap regenerated');
  }

  /** Expire lapsed subscriptions nightly. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'expire-subscriptions' })
  async expireSubscriptions(): Promise<void> {
    const count = await this.subscriptions.expireLapsed();
    if (count) this.logger.log(`Expired ${count} lapsed subscriptions`);
  }

  /** Reconcile the materialized revenue ledger against paid order-items nightly. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'reconcile-ledger' })
  async reconcileLedger(): Promise<void> {
    const created = await this.revenue.reconcileLedger();
    if (created) this.logger.log(`Revenue ledger reconciled: ${created} entries backfilled`);
  }

  /** Enqueue a daily email digest for users with unread notifications. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'enqueue-digests' })
  async enqueueDailyDigests(): Promise<void> {
    const rows = await this.notificationRepository
      .createQueryBuilder('n')
      .innerJoin('users', 'u', 'u.id = n.user_id')
      .select('u.email', 'email')
      .addSelect('u.first_name', 'firstName')
      .addSelect('COUNT(*)', 'cnt')
      .where('n.read_at IS NULL')
      .groupBy('u.email')
      .addGroupBy('u.first_name')
      .getRawMany<{ email: string; firstName: string | null; cnt: string }>();

    for (const r of rows) {
      await this.queue.enqueueDigest({
        to: r.email,
        name: r.firstName ?? '',
        unreadCount: Number(r.cnt),
      });
    }
    if (rows.length) this.logger.log(`Enqueued ${rows.length} notification digests`);
  }

  /** Prune analytics events older than 180 days to keep the table lean. */
  @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'prune-analytics' })
  async pruneAnalytics(): Promise<void> {
    const cutoff = new Date(Date.now() - 180 * 86_400_000);
    const result = await this.analyticsRepository.delete({ createdAt: LessThan(cutoff) });
    if (result.affected) this.logger.log(`Pruned ${result.affected} old analytics events`);
  }
}
