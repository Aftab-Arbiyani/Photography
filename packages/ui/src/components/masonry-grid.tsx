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
        'gap-2 [column-fill:_balance] columns-2 md:columns-3 lg:columns-4 xl:columns-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
