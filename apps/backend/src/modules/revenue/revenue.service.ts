import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ContentStatus,
  NotificationType,
  OrderStatus,
  PayoutMethod,
  PayoutStatus,
  type Paginated,
  type PhotographerDashboard,
  type PhotographerEarnings,
  type PublicPayout,
} from '@photography/types';
import { displayName, normalizePagination, paginate } from '@photography/utils';
import type { CommerceConfig } from '../../config/configuration';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { StripeService } from '../payments/stripe.service';
import { splitRevenue } from './revenue.math';
import { Album } from '../albums/entities/album.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Photo } from '../photos/entities/photo.entity';
import { PhotographerProfile } from '../photographers/entities/photographer-profile.entity';
import { User } from '../users/entities/user.entity';
import { Payout } from './entities/payout.entity';
import { RevenueLedgerEntry } from './entities/revenue-ledger-entry.entity';

const PENDING_PAYOUT_STATUSES = [PayoutStatus.REQUESTED, PayoutStatus.PROCESSING];

@Injectable()
export class RevenueService {
  private readonly currency: string;

  constructor(
    @InjectRepository(Payout) private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(RevenueLedgerEntry)
    private readonly ledgerRepository: Repository<RevenueLedgerEntry>,
    @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(PhotographerProfile)
    private readonly profileRepository: Repository<PhotographerProfile>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly stripe: StripeService,
    configService: ConfigService,
  ) {
    this.currency = configService.getOrThrow<CommerceConfig>('commerce').currency;
  }

  private toPublicPayout(p: Payout): PublicPayout {
    return {
      id: p.id,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status,
      method: p.method,
      reference: p.reference,
      createdAt: p.createdAt.toISOString(),
      processedAt: p.processedAt?.toISOString() ?? null,
    };
  }

  /**
   * Earnings derived directly from PAID order-items (read model — no duplicate
   * ledger, no edits to OrdersService). Net = gross × (1 − commissionRate).
   */
  async getEarnings(photographerId: string): Promise<PhotographerEarnings> {
    const profile = await this.profileRepository.findOne({ where: { userId: photographerId } });
    const commissionRate = profile ? Number(profile.commissionRate) : 0.3;

    const sales = await this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoin(Order, 'o', 'o.id = oi.order_id')
      .where('oi.photographer_id = :pid', { pid: photographerId })
      .andWhere('o.status = :paid', { paid: OrderStatus.PAID })
      .select('COALESCE(SUM(oi.unit_price_cents), 0)', 'gross')
      .addSelect('COUNT(*)', 'count')
      .getRawOne<{ gross: string; count: string }>();

    const grossCents = Number(sales?.gross ?? 0);
    const salesCount = Number(sales?.count ?? 0);
    const { netCents, commissionCents } = splitRevenue(grossCents, commissionRate);

    const pending = await this.payoutRepository
      .createQueryBuilder('p')
      .where('p.photographer_id = :pid', { pid: photographerId })
      .andWhere('p.status IN (:...statuses)', { statuses: PENDING_PAYOUT_STATUSES })
      .select('COALESCE(SUM(p.amount_cents), 0)', 'sum')
      .getRawOne<{ sum: string }>();
    const pendingPayoutCents = Number(pending?.sum ?? 0);
    const paidOutCents = profile ? Number(profile.paidOutCents) : 0;

    return {
      grossCents,
      commissionCents,
      netCents,
      paidOutCents,
      pendingPayoutCents,
      availableCents: Math.max(0, netCents - paidOutCents - pendingPayoutCents),
      salesCount,
      currency: this.currency,
    };
  }

  async dashboard(photographerId: string): Promise<PhotographerDashboard> {
    const profile = await this.profileRepository.findOne({ where: { userId: photographerId } });
    if (!profile) throw new NotFoundException('Photographer profile not found');
    const user = await this.userRepository.findOneByOrFail({ id: photographerId });

    const [earnings, photosCount, albumsCount, topPhotos] = await Promise.all([
      this.getEarnings(photographerId),
      this.photoRepository.count({ where: { photographerId, status: ContentStatus.PUBLISHED } }),
      this.albumRepository.count({ where: { photographerId } }),
      this.photoRepository.find({
        where: { photographerId, status: ContentStatus.PUBLISHED },
        order: { viewsCount: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      profile: {
        id: profile.id,
        userId: profile.userId,
        displayName: displayName(user.firstName, user.lastName, user.email),
        headline: profile.headline,
        verificationStatus: profile.verificationStatus,
        isVerified: profile.verifiedAt !== null,
        commissionRate: Number(profile.commissionRate),
        createdAt: profile.createdAt.toISOString(),
      },
      earnings,
      photosCount,
      albumsCount,
      followersCount: user.followersCount,
      // Per-photo sales aren't attributable (albums are the sold unit) → views only.
      topPhotos: topPhotos.map((p) => ({
        id: p.id,
        title: p.title,
        views: p.viewsCount,
        sales: 0,
      })),
    };
  }

  // ---- payouts ----

  async requestPayout(photographerId: string, amountCents: number): Promise<PublicPayout> {
    const earnings = await this.getEarnings(photographerId);
    if (amountCents > earnings.availableCents) {
      throw new BadRequestException('Amount exceeds available balance');
    }
    const profile = await this.profileRepository.findOne({ where: { userId: photographerId } });
    const payout = await this.payoutRepository.save(
      this.payoutRepository.create({
        photographerId,
        amountCents,
        currency: this.currency,
        status: PayoutStatus.REQUESTED,
        method: profile?.payoutMethod ?? PayoutMethod.STRIPE,
      }),
    );
    return this.toPublicPayout(payout);
  }

  async myPayouts(
    photographerId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<PublicPayout>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [rows, total] = await this.payoutRepository.findAndCount({
      where: { photographerId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      rows.map((p) => this.toPublicPayout(p)),
      total,
      page,
      limit,
    );
  }

  async adminListPayouts(
    status: PayoutStatus | undefined,
    query: PaginationQueryDto,
  ): Promise<Paginated<PublicPayout>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [rows, total] = await this.payoutRepository.findAndCount({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      rows.map((p) => this.toPublicPayout(p)),
      total,
      page,
      limit,
    );
  }

  async processPayout(
    payoutId: string,
    adminId: string,
    status: PayoutStatus,
    reference?: string,
    failureReason?: string,
  ): Promise<PublicPayout> {
    const payout = await this.payoutRepository.findOne({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');

    // When marking PAID, push the funds via Stripe Connect (if configured + onboarded).
    let transferReference = reference;
    if (status === PayoutStatus.PAID && this.stripe.enabled) {
      const profile = await this.profileRepository.findOne({
        where: { userId: payout.photographerId },
      });
      if (profile?.stripeAccountId) {
        try {
          transferReference = await this.stripe.createTransfer({
            amountCents: payout.amountCents,
            currency: payout.currency,
            destinationAccountId: profile.stripeAccountId,
            metadata: { payoutId: payout.id, photographerId: payout.photographerId },
          });
        } catch (error) {
          throw new BadRequestException(`Stripe transfer failed: ${(error as Error).message}`);
        }
      }
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      payout.status = status;
      payout.processedBy = adminId;
      payout.reference = transferReference ?? payout.reference;
      payout.failureReason = failureReason ?? null;
      payout.processedAt =
        status === PayoutStatus.PAID || status === PayoutStatus.FAILED ? new Date() : null;
      const result = await manager.save(payout);

      // On payout, lock in the amount against the photographer's lifetime paid-out total.
      if (status === PayoutStatus.PAID) {
        await manager.increment(
          PhotographerProfile,
          { userId: payout.photographerId },
          'paidOutCents',
          payout.amountCents,
        );
      }
      return result;
    });

    await this.notifications.emit({
      userId: payout.photographerId,
      type: NotificationType.SYSTEM,
      title: status === PayoutStatus.PAID ? 'Payout sent' : `Payout ${status}`,
      body:
        status === PayoutStatus.PAID
          ? `Your payout of ${(payout.amountCents / 100).toFixed(2)} ${payout.currency.toUpperCase()} has been sent.`
          : `Your payout status is now ${status}.`,
      linkUrl: '/dashboard/photographer/earnings',
    });
    return this.toPublicPayout(saved);
  }

  /** Platform-wide revenue rollup (admin). */
  async platformRevenue(): Promise<{
    grossCents: number;
    commissionCents: number;
    payoutsPaidCents: number;
    currency: string;
  }> {
    const profiles = await this.profileRepository.find();
    const rateByUser = new Map(profiles.map((p) => [p.userId, Number(p.commissionRate)]));

    const rows = await this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoin(Order, 'o', 'o.id = oi.order_id')
      .where('o.status = :paid', { paid: OrderStatus.PAID })
      .select('oi.photographer_id', 'pid')
      .addSelect('COALESCE(SUM(oi.unit_price_cents), 0)', 'gross')
      .groupBy('oi.photographer_id')
      .getRawMany<{ pid: string; gross: string }>();

    let grossCents = 0;
    let commissionCents = 0;
    for (const r of rows) {
      const gross = Number(r.gross);
      const rate = rateByUser.get(r.pid) ?? 0.3;
      grossCents += gross;
      commissionCents += splitRevenue(gross, rate).commissionCents;
    }
    const paid = await this.payoutRepository
      .createQueryBuilder('p')
      .where('p.status = :paid', { paid: PayoutStatus.PAID })
      .select('COALESCE(SUM(p.amount_cents), 0)', 'sum')
      .getRawOne<{ sum: string }>();

    return {
      grossCents,
      commissionCents,
      payoutsPaidCents: Number(paid?.sum ?? 0),
      currency: this.currency,
    };
  }

  /**
   * Nightly reconciliation: backfills ledger entries for any paid order-items
   * that lack one (e.g. orders fulfilled before the ledger existed, or if a
   * post-commit write was missed). Idempotent via the unique (order_item, type)
   * index. Returns the number of entries created.
   */
  async reconcileLedger(batch = 1000): Promise<number> {
    const rows = await this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoin(Order, 'o', 'o.id = oi.order_id')
      .where('o.status IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.PARTIALLY_REFUNDED, OrderStatus.REFUNDED],
      })
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM revenue_ledger rl WHERE rl.order_item_id = oi.id AND rl.type = 'sale')`,
      )
      .addSelect('o.currency', 'o_currency')
      .limit(batch)
      .getMany();

    if (rows.length === 0) return 0;

    const profiles = await this.profileRepository.find();
    const rateByUser = new Map(profiles.map((p) => [p.userId, Number(p.commissionRate)]));

    let created = 0;
    for (const item of rows) {
      const rate = rateByUser.get(item.photographerId) ?? 0.3;
      const split = splitRevenue(item.unitPriceCents, rate);
      try {
        await this.ledgerRepository.insert({
          orderId: item.orderId,
          orderItemId: item.id,
          photographerId: item.photographerId,
          type: 'sale',
          grossCents: split.grossCents,
          commissionCents: split.commissionCents,
          netCents: split.netCents,
          commissionRate: rate.toFixed(4),
          currency: this.currency,
        });
        created += 1;
      } catch {
        // unique violation → another writer already inserted it; skip.
      }
    }
    return created;
  }
}
