import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type Stripe from 'stripe';
import type { CheckoutIntent } from '@photography/types';
import type { RequestUser } from '../../common/types/authenticated-request';
import { OrdersService } from '../orders/orders.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly ordersService: OrdersService,
  ) {}

  /** Create a pending order from the cart and a Stripe PaymentIntent for it. */
  async checkout(user: RequestUser): Promise<CheckoutIntent> {
    const order = await this.ordersService.createPendingFromCart(user);

    // 100%-off coupon → fulfill immediately, no card needed.
    if (order.totalCents <= 0) {
      await this.ordersService.fulfillFreeOrder(order.id);
      return {
        orderId: order.id,
        clientSecret: '',
        publishableKey: this.stripe.publishableKey,
        amountCents: 0,
        currency: order.currency,
      };
    }

    if (!this.stripe.enabled) {
      throw new ServiceUnavailableException('Payments are not configured');
    }

    const intent = await this.stripe.createPaymentIntent({
      amountCents: order.totalCents,
      currency: order.currency,
      orderId: order.id,
      receiptEmail: order.billingEmail,
    });
    await this.ordersService.attachPaymentIntent(order.id, intent.id);

    return {
      orderId: order.id,
      clientSecret: intent.clientSecret,
      publishableKey: this.stripe.publishableKey,
      amountCents: order.totalCents,
      currency: order.currency,
    };
  }

  /** Verify and dispatch a Stripe webhook event. */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: true }> {
    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(rawBody, signature);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : undefined;
        await this.ordersService.fulfillByPaymentIntent(pi.id, chargeId);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.ordersService.markFailedByPaymentIntent(pi.id);
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
    return { received: true };
  }

  /** Admin-initiated refund (full or partial). */
  async refund(
    orderId: string,
    amountCents?: number,
  ): Promise<{ refundedCents: number; full: boolean }> {
    const order = await this.ordersService.getByIdForAdmin(orderId);
    if (!order.stripePaymentIntentId) {
      throw new BadRequestException('Order has no payment to refund');
    }
    const refundable = order.totalCents - order.refundedCents;
    const amount = amountCents ?? refundable;
    if (amount <= 0 || amount > refundable) {
      throw new BadRequestException('Invalid refund amount');
    }

    await this.stripe.refund(order.stripePaymentIntentId, amount);
    const full = order.refundedCents + amount >= order.totalCents;
    await this.ordersService.applyRefund(order, amount, full);
    return { refundedCents: amount, full };
  }
}
