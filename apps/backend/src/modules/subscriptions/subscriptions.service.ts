import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import type Stripe from 'stripe';
import {
  type MembershipState,
  type PublicPlan,
  type PublicSubscription,
  SubscriptionStatus,
} from '@photography/types';
import type { AppConfig } from '../../config/configuration';
import { RedisService } from '../../redis/redis.service';
import { StripeService } from '../payments/stripe.service';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';

const MEMBERSHIP_CACHE_TTL = 60;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly stripe: StripeService,
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.getOrThrow<AppConfig>('app').frontendUrl;
  }

  private toPublicPlan(p: SubscriptionPlan): PublicPlan {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      interval: p.interval,
      features: p.features ?? [],
      isActive: p.isActive,
    };
  }

  async listPlans(): Promise<PublicPlan[]> {
    const plans = await this.planRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', priceCents: 'ASC' },
    });
    return plans.map((p) => this.toPublicPlan(p));
  }

  private membershipKey(userId: string): string {
    return `membership:${userId}`;
  }

  /** Resolve a user's current membership (cached). Premium = active premium plan. */
  async getMembership(userId: string): Promise<MembershipState> {
    const cached = await this.redis.get<MembershipState>(this.membershipKey(userId));
    if (cached) return cached;

    const sub = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });

    const state: MembershipState =
      sub && sub.isActiveNow
        ? {
            isPremium: sub.plan?.isPremium ?? false,
            planCode: sub.plan?.code ?? null,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          }
        : { isPremium: false, planCode: null, status: null, currentPeriodEnd: null };

    await this.redis.set(this.membershipKey(userId), state, MEMBERSHIP_CACHE_TTL);
    return state;
  }

  async isPremium(userId: string): Promise<boolean> {
    return (await this.getMembership(userId)).isPremium;
  }

  async mySubscription(userId: string): Promise<PublicSubscription | null> {
    const sub = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });
    if (!sub) return null;
    return {
      id: sub.id,
      planCode: sub.plan?.code ?? '',
      planName: sub.plan?.name ?? '',
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      isPremium: sub.isActiveNow && (sub.plan?.isPremium ?? false),
    };
  }

  /** Subscribe to a plan. Free plans activate immediately; paid plans return a Stripe Checkout URL. */
  async subscribe(
    userId: string,
    planCode: string,
  ): Promise<{ checkoutUrl: string | null; activated: boolean }> {
    const plan = await this.planRepository.findOne({ where: { code: planCode, isActive: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    const user = await this.userRepository.findOneByOrFail({ id: userId });

    if (plan.priceCents === 0) {
      await this.upsertLocalSubscription(
        userId,
        plan.id,
        SubscriptionStatus.ACTIVE,
        null,
        null,
        null,
      );
      await this.redis.del(this.membershipKey(userId));
      return { checkoutUrl: null, activated: true };
    }

    if (!this.stripe.enabled || !plan.stripePriceId) {
      throw new BadRequestException('Paid plans require Stripe configuration');
    }

    const session = await this.stripe.createSubscriptionCheckout({
      priceId: plan.stripePriceId,
      customerEmail: user.email,
      successUrl: `${this.frontendUrl}/account/membership?status=success`,
      cancelUrl: `${this.frontendUrl}/pricing?status=cancelled`,
      metadata: { userId, planId: plan.id },
    });
    return { checkoutUrl: session.url, activated: false };
  }

  async cancel(userId: string): Promise<{ cancelAtPeriodEnd: boolean }> {
    const sub = await this.subscriptionRepository.findOne({
      where: { userId, status: Not(SubscriptionStatus.CANCELED) },
      order: { createdAt: 'DESC' },
    });
    if (!sub) throw new NotFoundException('No active subscription');
    if (sub.stripeSubscriptionId && this.stripe.enabled) {
      await this.stripe.cancelSubscription(sub.stripeSubscriptionId, true);
    }
    sub.cancelAtPeriodEnd = true;
    await this.subscriptionRepository.save(sub);
    await this.redis.del(this.membershipKey(userId));
    return { cancelAtPeriodEnd: true };
  }

  private async upsertLocalSubscription(
    userId: string,
    planId: string,
    status: SubscriptionStatus,
    stripeSubscriptionId: string | null,
    stripeCustomerId: string | null,
    currentPeriodEnd: Date | null,
  ): Promise<void> {
    const existing = await this.subscriptionRepository.findOne({ where: { userId } });
    if (existing) {
      Object.assign(existing, {
        planId,
        status,
        stripeSubscriptionId,
        stripeCustomerId,
        currentPeriodEnd,
      });
      await this.subscriptionRepository.save(existing);
    } else {
      await this.subscriptionRepository.save(
        this.subscriptionRepository.create({
          userId,
          planId,
          status,
          stripeSubscriptionId,
          stripeCustomerId,
          currentPeriodEnd,
        }),
      );
    }
  }

  // ---- Stripe webhook (subscription lifecycle) ----

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: true }> {
    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(rawBody, signature);
    } catch (err) {
      throw new BadRequestException(`Webhook signature failed: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.mode === 'subscription' &&
          session.metadata?.userId &&
          session.metadata?.planId
        ) {
          const stripeSub = session.subscription as string;
          await this.upsertLocalSubscription(
            session.metadata.userId,
            session.metadata.planId,
            SubscriptionStatus.ACTIVE,
            stripeSub,
            session.customer as string,
            null,
          );
          await this.redis.del(this.membershipKey(session.metadata.userId));
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        await this.syncFromStripe(stripeSub);
        break;
      }
      default:
        this.logger.debug(`Unhandled subscription event: ${event.type}`);
    }
    return { received: true };
  }

  private async syncFromStripe(stripeSub: Stripe.Subscription): Promise<void> {
    const local = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSub.id },
    });
    if (!local) return;
    local.status = this.mapStatus(stripeSub.status);
    local.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
    const periodEnd = (stripeSub as unknown as { current_period_end?: number }).current_period_end;
    local.currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : local.currentPeriodEnd;
    await this.subscriptionRepository.save(local);
    await this.redis.del(this.membershipKey(local.userId));
  }

  private mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'past_due':
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  /** Used by the cron sweep: expire subscriptions whose period has lapsed. */
  async expireLapsed(): Promise<number> {
    const result = await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.CANCELED })
      .where('status IN (:...active)', {
        active: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      })
      .andWhere('current_period_end IS NOT NULL')
      .andWhere('current_period_end < now()')
      .execute();
    return result.affected ?? 0;
  }
}
