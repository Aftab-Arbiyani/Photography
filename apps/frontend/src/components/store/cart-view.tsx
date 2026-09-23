'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { App, Button, Card, Divider, Empty, Input, Spin, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { PublicCart } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { formatMoney } from '@/lib/money';

export function CartView() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { message } = App.useApp();
  const [cart, setCart] = useState<PublicCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/cart');
      return;
    }
    client
      .cart()
      .then(setCart)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  const remove = async (albumId: string) => {
    setCart(await client.cartRemove(albumId).catch(() => cart));
  };
  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setBusy(true);
    try {
      setCart(await client.cartApplyCoupon(coupon.trim()));
      message.success('Coupon applied');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Invalid coupon');
    } finally {
      setBusy(false);
    }
  };
  const removeCoupon = async () => setCart(await client.cartRemoveCoupon().catch(() => cart));

  if (loading || authLoading)
    return (
      <div className="flex min-h-[50svh] items-center justify-center pt-24">
        <Spin size="large" />
      </div>
    );

  const items = cart?.items ?? [];
  const t = cart?.totals;

  return (
    <section className="mx-auto max-w-content px-5 pt-28 pb-20">
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Your cart</h1>

      {items.length === 0 ? (
        <Empty description="Your cart is empty" className="py-16">
          <Link href="/store" className="text-primary">
            Browse the store
          </Link>
        </Empty>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((i) => (
              <Card key={i.id} size="small">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link href={`/store/${i.albumSlug}`} className="font-medium hover:text-primary">
                      {i.albumTitle}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {i.pricingName} · {i.licenseType}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatMoney(i.unitPriceCents, i.currency)}
                    </span>
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(i.albumId)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card title="Summary">
            {t && (
              <>
                <Row label="Subtotal" value={formatMoney(t.subtotalCents, t.currency)} />
                {t.discountCents > 0 && (
                  <Row
                    label="Album discounts"
                    value={`−${formatMoney(t.discountCents, t.currency)}`}
                  />
                )}
                {t.couponCents > 0 && (
                  <Row
                    label={`Coupon ${t.couponCode ?? ''}`}
                    value={`−${formatMoney(t.couponCents, t.currency)}`}
                  />
                )}
                {t.taxCents > 0 && <Row label="Tax" value={formatMoney(t.taxCents, t.currency)} />}
                <Divider className="!my-3" />
                <Row label="Total" value={formatMoney(t.totalCents, t.currency)} strong />

                <div className="mt-4">
                  {t.couponCode ? (
                    <div className="flex items-center justify-between">
                      <Tag color="green">{t.couponCode}</Tag>
                      <Button size="small" type="link" onClick={removeCoupon}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Input.Search
                      placeholder="Coupon code"
                      enterButton="Apply"
                      loading={busy}
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      onSearch={applyCoupon}
                    />
                  )}
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  className="!mt-5"
                  onClick={() => router.push('/checkout')}
                >
                  Checkout
                </Button>
              </>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-1 text-sm ${strong ? 'font-semibold' : 'text-ink-muted'}`}
    >
      <span>{label}</span>
      <span className={strong ? 'text-ink dark:text-parchment' : ''}>{value}</span>
    </div>
  );
}
