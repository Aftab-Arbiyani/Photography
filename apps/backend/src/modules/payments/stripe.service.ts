import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { StripeConfig } from '../../config/configuration';

export interface CreatedIntent {
  id: string;
  clientSecret: string;
}

/**
 * Thin wrapper over the Stripe SDK. Payments are optional — when no secret key is
 * configured the service stays "disabled" and the checkout endpoints return 503,
 * so the rest of the app boots and runs without Stripe.
 */
@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private client: Stripe | null = null;
  private cfg!: StripeConfig;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.cfg = this.configService.getOrThrow<StripeConfig>('stripe');
    if (this.cfg.enabled) {
      this.client = new Stripe(this.cfg.secretKey, {
        apiVersion: this.cfg.apiVersion as Stripe.StripeConfig['apiVersion'],
        typescript: true,
      });
      this.logger.log('Stripe payments enabled');
    } else {
      this.logger.warn('Stripe not configured — payments are disabled');
    }
  }

  get enabled(): boolean {
    return this.cfg.enabled;
  }

  get publishableKey(): string {
    return this.cfg.publishableKey;
  }

  private require(): Stripe {
    if (!this.client) {
      throw new ServiceUnavailableException('Payments are not configured');
    }
    return this.client;
  }

  async createPaymentIntent(params: {
    amountCents: number;
    currency: string;
    orderId: string;
    receiptEmail: string;
    metadata?: Record<string, string>;
  }): Promise<CreatedIntent> {
    const intent = await this.require().paymentIntents.create({
      amount: params.amountCents,
      currency: params.currency,
      receipt_email: params.receiptEmail,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: params.orderId, ...params.metadata },
    });
    return { id: intent.id, clientSecret: intent.client_secret as string };
  }

  /** Verify + parse a webhook payload using the raw request body. */
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.require().webhooks.constructEvent(payload, signature, this.cfg.webhookSecret);
  }

  async refund(paymentIntentId: string, amountCents?: number): Promise<Stripe.Refund> {
    return this.require().refunds.create({
      payment_intent: paymentIntentId,
      ...(amountCents ? { amount: amountCents } : {}),
    });
  }

  // ---- subscriptions (memberships) ----

  /** Create a Checkout Session for a recurring subscription price. */
  async createSubscriptionCheckout(params: {
    priceId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ id: string; url: string }> {
    const session = await this.require().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: { metadata: params.metadata },
    });
    return { id: session.id, url: session.url as string };
  }

  async cancelSubscription(
    stripeSubscriptionId: string,
    atPeriodEnd = true,
  ): Promise<Stripe.Subscription> {
    if (atPeriodEnd) {
      return this.require().subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return this.require().subscriptions.cancel(stripeSubscriptionId);
  }

  retrieveSubscription(id: string): Promise<Stripe.Subscription> {
    return this.require().subscriptions.retrieve(id);
  }

  // ---- Connect (photographer payouts) ----

  /** Create an Express connected account for a photographer. */
  async createConnectAccount(email: string, metadata?: Record<string, string>): Promise<string> {
    const account = await this.require().accounts.create({
      type: 'express',
      email,
      capabilities: { transfers: { requested: true } },
      metadata,
    });
    return account.id;
  }

  /** Hosted onboarding link for a connected account to complete KYC/bank details. */
  async createAccountOnboardingLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<string> {
    const link = await this.require().accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return link.url;
  }

  /** Whether the connected account can receive payouts (onboarding complete). */
  async getAccountPayoutsEnabled(accountId: string): Promise<boolean> {
    const account = await this.require().accounts.retrieve(accountId);
    return Boolean(account.payouts_enabled);
  }

  /** Transfer funds from the platform balance to a photographer's connected account. */
  async createTransfer(params: {
    amountCents: number;
    currency: string;
    destinationAccountId: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const transfer = await this.require().transfers.create({
      amount: params.amountCents,
      currency: params.currency,
      destination: params.destinationAccountId,
      metadata: params.metadata,
    });
    return transfer.id;
  }
}
