'use client';

import { useState } from 'react';
import type { PhotoAssets } from '@photography/types';
import { cn } from '../cn';

interface ResponsiveImageProps {
  assets: PhotoAssets;
  alt: string;
  /** intrinsic dimensions, for correct aspect-ratio reservation (no layout shift) */
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Framework-agnostic progressive image: serves AVIF → WebP → original via <picture>,
 * reserves space with the intrinsic aspect ratio, and fades in over the blur LQIP
 * placeholder. No Next.js coupling so the package stays portable.
 */
export function ResponsiveImage({
  assets,
  alt,
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className,
  priority = false,
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn('relative overflow-hidden bg-neutral-200 dark:bg-neutral-800', className)}
      style={{
        aspectRatio: `${width} / ${height}`,
        backgroundImage: assets.blurDataUrl ? `url(${assets.blurDataUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <picture>
        {assets.avif && <source srcSet={assets.avif} type="image/avif" sizes={sizes} />}
        {assets.webp && <source srcSet={assets.webp} type="image/webp" sizes={sizes} />}
        <img
          src={assets.webp || assets.original}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-700',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      </picture>
    </div>
  );
}
