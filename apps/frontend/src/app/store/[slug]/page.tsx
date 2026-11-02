'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { App, Button, Empty, Form, Input, List, Radio, Rate, Spin } from 'antd';
import {
  CheckCircleFilled,
  HeartFilled,
  HeartOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { MarketplaceAlbum, PublicPhoto, PublicReview } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { formatMoney } from '@/lib/money';
import { AlbumCard } from '@/components/store/album-card';
import { PhotoGrid } from '@/components/gallery/photo-grid';

/** Raised panel surface, matching the photo page's sidebar cards. */
const panel = 'rounded-card border border-hairline bg-canvas p-5 dark:bg-tile-2';
const pill = 'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-bold';

export default function StoreAlbumPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { message } = App.useApp();

  const [album, setAlbum] = useState<MarketplaceAlbum | null>(null);
  const [photos, setPhotos] = useState<PublicPhoto[]>([]);
  const [related, setRelated] = useState<MarketplaceAlbum[]>([]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [pricingId, setPricingId] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const a = await client.marketplaceAlbum(slug);
      setAlbum(a);
      setWishlisted(a.wishlisted ?? false);
      setPricingId(a.pricing.find((p) => p.isDefault)?.id ?? a.pricing[0]?.id ?? null);
      const [g, rel, rv] = await Promise.all([
        client
          .gallery(`?albumId=${a.id}&limit=12`)
          .catch(() => ({ items: [] as PublicPhoto[], nextCursor: null, hasMore: false })),
        client.marketplaceRelated(slug).catch(() => [] as MarketplaceAlbum[]),
        client.albumReviews(a.id).catch(() => ({ items: [] as PublicReview[], meta: null })),
      ]);
      setPhotos(g.items);
      setRelated(rel);
      setReviews((rv as { items: PublicReview[] }).items);
    } catch {
      setAlbum(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const requireAuth = (): boolean => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/store/${slug}`);
      return false;
    }
    return true;
  };

  const addToCart = async () => {
    if (!requireAuth() || !album || !pricingId) return;
    setAdding(true);
    try {
      await client.cartAdd(album.id, pricingId);
      message.success('Added to cart');
      router.push('/cart');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    if (!requireAuth() || !album) return;
    const next = !wishlisted;
    setWishlisted(next);
    try {
      if (next) await client.addWishlist(album.id);
      else await client.removeWishlist(album.id);
    } catch {
      setWishlisted(!next);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[60svh] items-center justify-center pt-8">
        <Spin size="large" />
      </div>
    );
  if (!album)
    return (
      <div className="mx-auto max-w-content px-5 pt-10 pb-20 text-center">
        <Empty description="Set not found" />
        <Link href="/store" className="mt-2 inline-block text-sm font-semibold text-primary">
          Back to the shop
        </Link>
      </div>
    );

  return (
    <article className="mx-auto max-w-wide px-5 pt-10 pb-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* preview */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-display-lg font-bold tracking-tight">{album.title}</h1>
            {album.isFeatured && (
              <span className={`${pill} bg-primary text-ink-fixed`}>Featured</span>
            )}
          </div>
          {album.description && (
            <p className="mt-3 max-w-prose text-ink-muted">{album.description}</p>
          )}

          {album.trailerUrl && (
            <a
              href={album.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-focus"
            >
              <PlayCircleOutlined aria-hidden />
              Watch the trailer
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}

          <h2 className="font-display mt-8 mb-3 text-tagline font-bold tracking-tight">
            Sample images
          </h2>
          {photos.length === 0 ? (
            <p className="text-sm text-ink-muted">No preview images yet.</p>
          ) : (
            <PhotoGrid photos={photos} rowHeight={200} />
          )}
        </div>

        {/* purchase panel */}
        <aside>
          <div className={`sticky top-20 ${panel}`}>
            {album.purchased && (
              <p className={`${pill} mb-4 bg-ink/10 text-ink`}>
                <CheckCircleFilled aria-hidden className="!text-primary" />
                You own this
              </p>
            )}
            <Radio.Group
              className="flex w-full flex-col gap-3"
              value={pricingId}
              onChange={(e) => setPricingId(e.target.value)}
            >
              {album.pricing.map((p) => (
                <Radio key={p.id} value={p.id} className="!flex w-full items-center">
                  <span className="flex w-full items-center justify-between gap-4">
                    <span>
                      <span className="font-medium">{p.name}</span>{' '}
                      <span className="text-xs text-ink-muted">
                        ({p.licenseType}
                        {p.includesRaw ? ' · RAW' : ''})
                      </span>
                    </span>
                    <span className="font-semibold">
                      {p.effectivePriceCents < p.priceCents && (
                        <span className="mr-2 text-xs text-ink-muted line-through">
                          {formatMoney(p.priceCents, p.currency)}
                        </span>
                      )}
                      {formatMoney(p.effectivePriceCents, p.currency)}
                    </span>
                  </span>
                </Radio>
              ))}
            </Radio.Group>

            {album.pricing.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">Not available for purchase yet.</p>
            ) : (
              <Button
                type="primary"
                size="large"
                block
                className="!mt-5"
                loading={adding}
                onClick={addToCart}
              >
                {album.purchased ? 'Buy again' : 'Add to cart'}
              </Button>
            )}
            <Button
              size="large"
              block
              className="!mt-3"
              aria-pressed={wishlisted}
              icon={
                wishlisted ? (
                  <HeartFilled aria-hidden className="!text-primary" />
                ) : (
                  <HeartOutlined aria-hidden />
                )
              }
              onClick={toggleWishlist}
            >
              {wishlisted ? 'In wishlist' : 'Add to wishlist'}
            </Button>
          </div>
        </aside>
      </div>

      <ReviewsSection album={album} reviews={reviews} onChange={load} />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display mb-5 text-tagline font-bold tracking-tight">More sets</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <AlbumCard key={r.id} album={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function ReviewsSection({
  album,
  reviews,
  onChange,
}: {
  album: MarketplaceAlbum;
  reviews: PublicReview[];
  onChange: () => void;
}) {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values: { rating: number; title?: string; body?: string }) => {
    setSubmitting(true);
    try {
      await client.upsertReview(album.id, values.rating, values.title, values.body);
      message.success('Review saved');
      onChange();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not save review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 border-t border-hairline pt-10">
      <h2 className="font-display mb-4 text-tagline font-bold tracking-tight">
        Reviews{' '}
        {album.ratingCount > 0 && (
          <span className="text-ink-muted">
            · {album.ratingAverage.toFixed(1)} ({album.ratingCount})
          </span>
        )}
      </h2>

      {album.purchased && (
        <div className={`mb-6 ${panel}`}>
          <Form layout="vertical" onFinish={submit} requiredMark={false}>
            <Form.Item
              name="rating"
              label="Your rating"
              rules={[{ required: true, message: 'Pick a rating' }]}
            >
              <Rate className="!text-primary" />
            </Form.Item>
            <Form.Item name="title" label="Title">
              <Input maxLength={160} />
            </Form.Item>
            <Form.Item name="body" label="Review">
              <Input.TextArea rows={3} maxLength={4000} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Submit review
            </Button>
          </Form>
        </div>
      )}

      <List
        dataSource={reviews}
        locale={{ emptyText: 'No reviews yet' }}
        renderItem={(r) => (
          <List.Item>
            <List.Item.Meta
              title={
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <Rate
                    disabled
                    value={r.rating}
                    className="!text-primary"
                    style={{ fontSize: 14 }}
                  />
                  {r.title}
                  {r.isVerifiedPurchase && (
                    <span className={`${pill} bg-ink/10 text-ink-muted`}>Verified purchase</span>
                  )}
                </span>
              }
              description={
                <span className="text-ink-muted">
                  {r.authorDisplayName} · {new Date(r.createdAt).toLocaleDateString()}
                  {r.body ? ` — ${r.body}` : ''}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </section>
  );
}
