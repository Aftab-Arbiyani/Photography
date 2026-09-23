import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import {
  NotificationType,
  OrderStatus,
  type Paginated,
  type PublicOrder,
} from '@photography/types';
import { displayName, normalizePagination, paginate } from '@photography/utils';
import type { CommerceConfig } from '../../config/configuration';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { MailService } from '../../mail/mail.service';
import type { OrderEmailData } from '../../mail/templates/email.templates';
import { Album } from '../albums/entities/album.entity';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Entitlement } from './entities/entitlement.entity';
import { RevenueLedgerEntry } from '../revenue/entities/revenue-ledger-entry.entity';
import { PhotographerProfile } from '../photographers/entities/photographer-profile.entity';
import { splitRevenue } from '../revenue/revenue.math';
import { toPublicOrder } from './order.mapper';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly commerce: CommerceConfig;

  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(Entitlement) private readonly entitlementRepository: Repository<Entitlement>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly cartService: CartService,
    private readonly couponsService: CouponsService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    configService: ConfigService,
  ) {
    this.commerce = configService.getOrThrow<CommerceConfig>('commerce');
  }

  private generateInvoiceNumber(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = randomUUID().slice(0, 4).toUpperCase();
    return `${this.commerce.invoicePrefix}-${stamp}-${rand}`;
  }

  /** Build a pending order (and its line snapshots) from the user's cart. */
  async createPendingFromCart(user: RequestUser): Promise<Order> {
    // getCheckoutContext throws on empty cart; view() yields validated totals (incl. coupon).
    const { lines } = await this.cartService.getCheckoutContext(user.id);
    const { totals } = await this.cartService.view(user.id);

    const order = this.orderRepository.create({
      invoiceNumber: this.generateInvoiceNumber(),
      userId: user.id,
      status: OrderStatus.PENDING,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      couponCents: totals.couponCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      currency: totals.currency,
      couponCode: totals.couponCode,
      billingEmail: user.email,
      items: lines.map((l) =>
        this.orderRepository.manager.create(OrderItem, {
          albumId: l.album.id,
          pricingId: l.pricing.id,
          photographerId: l.album.photographerId,
          albumTitle: l.album.title,
          pricingName: l.pricing.name,
          licenseType: l.pricing.licenseType,
          unitPriceCents: l.effectiveCents,
          downloadLimit: l.pricing.downloadLimit,
          includesRaw: l.pricing.includesRaw,
        }),
      ),
    });

    return this.orderRepository.save(order);
  }

  async attachPaymentIntent(orderId: string, paymentIntentId: string): Promise<void> {
    await this.orderRepository.update({ id: orderId }, { stripePaymentIntentId: paymentIntentId });
  }

  private toEmailData(order: Order): OrderEmailData {
    return {
      invoiceNumber: order.invoiceNumber,
      totalCents: order.totalCents,
      currency: order.currency,
      lines: (order.items ?? []).map((i) => ({
        title: i.albumTitle,
        licenseType: i.licenseType,
        unitPriceCents: i.unitPriceCents,
      })),
    };
  }

  /** Fulfill by Stripe payment intent (webhook path). */
  async fulfillByPaymentIntent(paymentIntentId: string, chargeId?: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: { items: true },
    });
    if (!order) {
      this.logger.warn(`fulfill: no order for payment_intent ${paymentIntentId}`);
      return;
    }
    await this.fulfillOrder(order, chargeId ?? null);
  }

  /** Fulfill a zero-total order (e.g. 100%-off coupon) with no Stripe charge. */
  async fulfillFreeOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    await this.fulfillOrder(order, null);
  }

  /** Idempotently fulfill an order: entitlements, counters, coupon, cart, emails. */
  private async fulfillOrder(order: Order, chargeId: string | null): Promise<void> {
    if (order.status === OrderStatus.PAID) return; // idempotent

    const expiresAt = new Date(Date.now() + this.commerce.downloadExpiryDays * 86_400_000);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Order,
        { id: order.id },
        {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          stripeChargeId: chargeId,
        },
      );

      for (const item of order.items) {
        await manager.insert(Entitlement, {
          userId: order.userId,
          albumId: item.albumId,
          orderId: order.id,
          licenseType: item.licenseType,
          downloadLimit: item.downloadLimit,
          includesRaw: item.includesRaw,
          expiresAt,
          isActive: true,
        });
        await manager.increment(Album, { id: item.albumId }, 'salesCount', 1);

        // Materialized revenue ledger entry (commission snapshotted at sale time).
        const profile = await manager.findOne(PhotographerProfile, {
          where: { userId: item.photographerId },
        });
        const rate = profile ? Number(profile.commissionRate) : 0.3;
        const split = splitRevenue(item.unitPriceCents, rate);
        await manager.insert(RevenueLedgerEntry, {
          orderId: order.id,
          orderItemId: item.id,
          photographerId: item.photographerId,
          type: 'sale',
          grossCents: split.grossCents,
          commissionCents: split.commissionCents,
          netCents: split.netCents,
          commissionRate: rate.toFixed(4),
          currency: order.currency,
        });
      }
    });

    // Post-commit side effects (never block / fail the payment path).
    if (order.couponCode) {
      await this.couponsService.redeemByCode(order.couponCode).catch(() => undefined);
    }
    await this.cartService.clear(order.userId).catch(() => undefined);
    const user = await this.userRepository.findOne({ where: { id: order.userId } });
    const name = user ? displayName(user.firstName, user.lastName, user.email) : 'there';

    await this.notifications.emit({
      userId: order.userId,
      type: NotificationType.PURCHASE_SUCCESS,
      title: 'Purchase complete',
      body: `Order ${order.invoiceNumber} is confirmed — your downloads are ready.`,
      linkUrl: '/dashboard/downloads',
    });

    const emailData = this.toEmailData(order);
    await this.mail.sendPurchaseSuccessEmail(order.billingEmail, name, emailData);
    await this.mail.sendInvoiceEmail(order.billingEmail, name, emailData);
    for (const item of order.items) {
      await this.mail.sendDownloadReadyEmail(order.billingEmail, name, item.albumTitle);
    }
  }

  async markFailedByPaymentIntent(paymentIntentId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!order || order.status !== OrderStatus.PENDING) return;
    await this.orderRepository.update(
      { id: order.id },
      {
        status: OrderStatus.FAILED,
        failedAt: new Date(),
      },
    );
    const user = await this.userRepository.findOne({ where: { id: order.userId } });
    const name = user ? displayName(user.firstName, user.lastName, user.email) : 'there';
    await this.notifications.emit({
      userId: order.userId,
      type: NotificationType.ORDER_FAILED,
      title: 'Payment failed',
      body: `We couldn't process payment for order ${order.invoiceNumber}.`,
      linkUrl: '/cart',
    });
    await this.mail.sendOrderFailedEmail(order.billingEmail, name, order.invoiceNumber);
  }

  /** Admin refund (full or partial). Deactivates entitlements on a full refund. */
  async applyRefund(order: Order, refundedCents: number, full: boolean): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Order,
        { id: order.id },
        {
          status: full ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED,
          refundedCents: order.refundedCents + refundedCents,
          refundedAt: new Date(),
        },
      );
      if (full) {
        await manager.update(Entitlement, { orderId: order.id }, { isActive: false });
      }
    });
    await this.notifications.emit({
      userId: order.userId,
      type: NotificationType.REFUND_PROCESSED,
      title: 'Refund processed',
      body: `Your refund for order ${order.invoiceNumber} has been processed.`,
      linkUrl: '/dashboard/orders',
    });
  }

  // ---------------- reads ----------------

  async getOwned(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getByIdForAdmin(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async listMine(userId: string, query: PaginationQueryDto): Promise<Paginated<PublicOrder>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(orders.map(toPublicOrder), total, page, limit);
  }

  async adminList(query: PaginationQueryDto): Promise<Paginated<PublicOrder>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [orders, total] = await this.orderRepository.findAndCount({
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(orders.map(toPublicOrder), total, page, limit);
  }
}
