'use client';

import { useEffect, useState } from 'react';
import { Empty, Spin, Tag } from 'antd';
import type { MarketplaceAlbum } from '@photography/types';
import { client } from '@/lib/api-client';

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  );

export default function WishlistPage() {
  const [albums, setAlbums] = useState<MarketplaceAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .myWishlist()
      .then(setAlbums)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Wishlist</h1>
      <p className="mt-2 mb-6 text-ink-muted">Albums you want to buy.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : albums.length === 0 ? (
        <Empty description="Your wishlist is empty" className="py-16" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <div
              key={a.id}
              className="rounded-card border border-hairline/60 p-5 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-tagline font-semibold">{a.title}</h2>
                {a.isFeatured && <Tag color="gold">Featured</Tag>}
              </div>
              {a.description && (
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{a.description}</p>
              )}
              <p className="mt-4 text-sm">
                {a.fromPriceCents !== null ? (
                  <>
                    From <strong>{money(a.fromPriceCents, a.currency)}</strong>
                  </>
                ) : (
                  <span className="text-ink-muted">Not for sale</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
