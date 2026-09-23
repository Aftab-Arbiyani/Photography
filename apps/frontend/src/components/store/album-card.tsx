'use client';

import Link from 'next/link';
import { Tag } from 'antd';
import { StarFilled } from '@ant-design/icons';
import type { MarketplaceAlbum } from '@photography/types';
import { formatMoney } from '@/lib/money';

/** Storefront album tile. Cover photography lands when cover-image resolution is wired. */
export function AlbumCard({ album }: { album: MarketplaceAlbum }) {
  return (
    <Link
      href={`/store/${album.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-hairline/60 bg-canvas transition hover:border-ink/30 dark:border-white/10 dark:bg-tile-2 dark:hover:border-white/30"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#11243f] to-[#050608] p-6 text-center">
        <span className="font-display text-lg font-semibold text-white/90">{album.title}</span>
        {album.isFeatured && (
          <Tag color="gold" className="!absolute left-3 top-3 !m-0">
            Featured
          </Tag>
        )}
        {album.discountActive && album.discountPercent > 0 && (
          <Tag color="red" className="!absolute right-3 top-3 !m-0">
            -{album.discountPercent}%
          </Tag>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{album.title}</span>
          {album.ratingCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <StarFilled style={{ color: '#f5a623' }} /> {album.ratingAverage.toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-muted">{album.photosCount} photos</p>
        <p className="mt-3 text-sm">
          {album.fromPriceCents !== null ? (
            <>
              From <strong>{formatMoney(album.fromPriceCents, album.currency)}</strong>
            </>
          ) : (
            <span className="text-ink-muted">Coming soon</span>
          )}
        </p>
      </div>
    </Link>
  );
}
