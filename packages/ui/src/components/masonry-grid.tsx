'use client';

import type { ReactNode } from 'react';
import { cn } from '../cn';

interface MasonryGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * CSS multi-column masonry. Columns reflow responsively; children should be
 * `break-inside-avoid` blocks (PhotoCard handles this). Pure CSS — no JS layout,
 * so it works with SSR and infinite scroll without measurement jank.
 */
export function MasonryGrid({ children, className }: MasonryGridProps) {
  return (
    <div
      className={cn(
        'gap-4 [column-fill:_balance] columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
