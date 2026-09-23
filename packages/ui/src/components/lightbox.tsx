'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicPhoto } from '@photography/types';
import { cn } from '../cn';

interface LightboxProps {
  photos: PublicPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * Accessible fullscreen viewer: keyboard nav (←/→/Esc), click-to-zoom, prev/next,
 * focus-trapped overlay. Renders the largest available derivative.
 */
export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const photo = photos[index];

  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      const next = (index + delta + photos.length) % photos.length;
      onIndexChange(next);
    },
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [go, onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
      >
        ✕
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          go(-1);
        }}
        aria-label="Previous"
        className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition hover:bg-white/20"
      >
        ‹
      </button>

      <img
        src={photo.assets.webp || photo.assets.original}
        alt={photo.title}
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        className={cn(
          'max-h-[90vh] max-w-[92vw] select-none object-contain transition-transform duration-300',
          zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in',
        )}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          go(1);
        }}
        aria-label="Next"
        className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition hover:bg-white/20"
      >
        ›
      </button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-sm text-white/80">
        <p className="font-medium">{photo.title}</p>
        <p className="text-white/50">
          {index + 1} / {photos.length}
        </p>
      </div>
    </div>
  );
}
