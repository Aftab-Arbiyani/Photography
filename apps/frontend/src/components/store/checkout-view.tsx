'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { App, Alert, Button, Card, Result, Spin } from 'antd';
import type { CheckoutIntent } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { siteConfig } from '@/lib/config';
import { formatMoney } from '@/lib/money';

type Phase = 'loading' | 'pay' | 'free-done' | 'error';

export function CheckoutView() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [phase, setPhase] = useState<Phase>('loading');
  const [intent, setIntent] = useState<CheckoutIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/checkout');
      return;
    }
    client
      .checkout()
      .then((ci) => {
        setIntent(ci);
        if (!ci.clientSecret || ci.amountCents <= 0) setPhase('free-done');
        else setPhase('pay');
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not start checkout');
        setPhase('error');
      });
  }, [authLoading, isAuthenticated, router]);

  // Memoize the Stripe promise per publishable key.
  const stripePromise = useMemo<Promise<Stripe | null> | null>(
    () => (intent?.publishableKey ? loadStripe(intent.publishableKey) : null),
    [intent?.publishableKey],
  );

  return (
    <section className="mx-auto max-w-md px-5 pt-10 pb-20">
      <h1 className="font-display mb-6 text-display-lg font-semibold tracking-tight">Checkout</h1>

      {phase === 'loading' && (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      )}

      {phase === 'error' && (
        <Alert
          type="error"
          showIcon
          message="Checkout unavailable"
          description={error}
          action={<Button onClick={() => router.push('/cart')}>Back to cart</Button>}
        />
      )}

      {phase === 'free-done' && (
        <Result
          status="success"
          title="Order complete"
          subTitle="Your free order is ready — find your downloads in your dashboard."
          extra={
            <Button type="primary" onClick={() => router.push('/dashboard/downloads')}>
              Go to downloads
            </Button>
          }
        />
      )}

      {phase === 'pay' && intent && stripePromise && (
        <Card>
          <p className="mb-4 text-sm text-ink-muted">
            Amount due:{' '}
            <strong className="text-ink dark:text-parchment">
              {formatMoney(intent.amountCents, intent.currency)}
            </strong>
          </p>
          <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret }}>
            <PaymentForm />
          </Elements>
        </Card>
      )}
    </section>
  );
}

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${siteConfig.url}/dashboard/downloads` },
    });
    // If confirmPayment returns, it failed (success redirects away).
    if (error) message.error(error.message ?? 'Payment failed');
    setSubmitting(false);
  };

  return (
    <div>
      <PaymentElement />
      <Button
        type="primary"
        size="large"
        block
        className="!mt-5"
        loading={submitting}
        disabled={!stripe}
        onClick={pay}
      >
        Pay now
      </Button>
      <p className="mt-3 text-center text-xs text-ink-muted">Secured by Stripe.</p>
    </div>
  );
}
