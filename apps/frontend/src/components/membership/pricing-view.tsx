'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Card, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import type { MembershipState, PublicPlan } from '@photography/types';
import { SubscriptionInterval } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { formatMoney } from '@/lib/money';

export function PricingView() {
  const router = useRouter();
  const { message } = App.useApp();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [membership, setMembership] = useState<MembershipState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const tasks: Promise<unknown>[] = [
      client
        .plans()
        .then(setPlans)
        .catch(() => undefined),
    ];
    if (isAuthenticated) {
      tasks.push(
        client
          .mySubscription()
          .then((r) => setMembership(r.membership))
          .catch(() => undefined),
      );
    }
    Promise.all(tasks).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const subscribe = async (plan: PublicPlan) => {
    if (!isAuthenticated) {
      router.push(`/login?next=/pricing`);
      return;
    }
    setBusy(plan.code);
    try {
      const res = await client.subscribe(plan.code);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      message.success('Membership activated');
      router.push('/account/membership');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not start checkout');
    } finally {
      setBusy(null);
    }
  };

  const intervalLabel = (i: SubscriptionInterval) =>
    i === SubscriptionInterval.YEAR ? '/year' : '/month';

  return (
    <section className="mx-auto max-w-wide px-5 pb-24 pt-28">
      <header className="mb-12 text-center">
        <p className="text-tagline text-primary">Membership</p>
        <h1 className="font-display mt-3 text-display-lg font-semibold tracking-tight">
          Choose your plan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lead text-ink-muted">
          Unlock premium galleries, higher-resolution downloads and priority support.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent =
            membership?.planCode === plan.code && membership?.isPremium === plan.priceCents > 0;
          const isFree = plan.priceCents === 0;
          return (
            <Card
              key={plan.id}
              className={isCurrent ? 'border-primary shadow-lg' : ''}
              title={
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-semibold">{plan.name}</span>
                  {isCurrent && <Tag color="green">Current</Tag>}
                </div>
              }
            >
              <div className="mb-4">
                <span className="font-display text-3xl font-semibold">
                  {isFree ? 'Free' : formatMoney(plan.priceCents, plan.currency)}
                </span>
                {!isFree && <span className="text-ink-muted">{intervalLabel(plan.interval)}</span>}
              </div>
              {plan.description && (
                <p className="mb-4 text-sm text-ink-muted">{plan.description}</p>
              )}
              <ul className="mb-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckOutlined className="mt-1 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                type={isCurrent ? 'default' : 'primary'}
                block
                size="large"
                disabled={isCurrent}
                loading={busy === plan.code}
                onClick={() => subscribe(plan)}
              >
                {isCurrent ? 'Your plan' : isFree ? 'Get started' : 'Subscribe'}
              </Button>
            </Card>
          );
        })}
      </div>

      {!loading && plans.length === 0 && (
        <p className="mt-10 text-center text-ink-muted">No plans are available right now.</p>
      )}
    </section>
  );
}
