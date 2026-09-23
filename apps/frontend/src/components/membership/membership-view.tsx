'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { App, Button, Card, Descriptions, Modal, Tag } from 'antd';
import type { MembershipState, PublicSubscription } from '@photography/types';
import { SubscriptionStatus } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

const STATUS_COLOR: Record<string, string> = {
  [SubscriptionStatus.ACTIVE]: 'green',
  [SubscriptionStatus.TRIALING]: 'blue',
  [SubscriptionStatus.PAST_DUE]: 'orange',
  [SubscriptionStatus.CANCELED]: 'default',
  [SubscriptionStatus.INCOMPLETE]: 'orange',
};

export function MembershipView() {
  const router = useRouter();
  const params = useSearchParams();
  const { message, modal } = App.useApp();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<PublicSubscription | null>(null);
  const [membership, setMembership] = useState<MembershipState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    client
      .mySubscription()
      .then((r) => {
        setSubscription(r.subscription);
        setMembership(r.membership);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/account/membership');
      return;
    }
    if (params.get('status') === 'success') {
      message.success('Subscription confirmed — welcome to premium!');
    }
    load();
  }, [authLoading, isAuthenticated, load, params, router, message]);

  const cancel = () => {
    modal.confirm({
      title: 'Cancel membership?',
      content: 'Your premium access stays active until the end of the current billing period.',
      okText: 'Cancel at period end',
      okButtonProps: { danger: true },
      cancelText: 'Keep membership',
      onOk: async () => {
        try {
          await client.cancelSubscription();
          message.success('Your membership will cancel at the period end');
          load();
        } catch (err) {
          message.error(err instanceof ApiError ? err.message : 'Could not cancel');
        }
      },
    });
  };

  return (
    <section className="mx-auto max-w-content px-5 pb-24 pt-28">
      <header className="mb-8">
        <p className="text-tagline text-primary">Account</p>
        <h1 className="font-display mt-2 text-display-lg font-semibold tracking-tight">
          Membership
        </h1>
      </header>

      <Card loading={loading}>
        {membership?.isPremium ? (
          <>
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="Plan">
                {subscription?.planName ?? membership.planCode}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[membership.status ?? ''] ?? 'default'}>
                  {membership.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Renews / ends">
                {membership.currentPeriodEnd
                  ? new Date(membership.currentPeriodEnd).toLocaleDateString(undefined, {
                      dateStyle: 'long',
                    })
                  : '—'}
              </Descriptions.Item>
              {subscription?.cancelAtPeriodEnd && (
                <Descriptions.Item label="Auto-renew">
                  <Tag color="orange">Cancels at period end</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            {!subscription?.cancelAtPeriodEnd && (
              <Button danger className="mt-6" onClick={cancel}>
                Cancel membership
              </Button>
            )}
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-lg">You&apos;re on the free plan.</p>
            <p className="mt-2 text-ink-muted">
              Upgrade to unlock premium galleries and high-resolution downloads.
            </p>
            <Link href="/pricing">
              <Button type="primary" size="large" className="mt-6">
                View plans
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </section>
  );
}
