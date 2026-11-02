// No 'use client': this module is hook-free and its sizing helpers must stay
// callable from server components (e.g. the home page's placeholder grid).
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../cn';

interface JustifiedGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Justified rows: every photo in a row shares one height and the row fills the
 * width edge to edge. Pure CSS flexbox — each child grows in proportion to its
 * aspect ratio (see `justifiedItemStyle`), so it SSRs and infinite-scrolls with
 * no measurement. The `.justified-grid::after` filler (globals.css) keeps the
 * last row from stretching.
 */
export function JustifiedGrid({ children, className }: JustifiedGridProps) {
  return <div className={cn('justified-grid flex flex-wrap gap-2', className)}>{children}</div>;
}

/**
 * Display aspect ratio for a justified item. Extreme panoramas/slivers are
 * clamped so one frame can't swallow or vanish from a row; the image box must
 * use this same ratio (and crop) or it won't match its row height.
 */
export function justifiedRatio(width: number, height: number): number {
  return Math.min(Math.max(width / Math.max(height, 1), 0.5), 2.6);
}

/** Flex sizing for one justified item; `rowHeight` is the target row height in px. */
export function justifiedItemStyle(width: number, height: number, rowHeight = 260): CSSProperties {
  const ratio = justifiedRatio(width, height);
  return { flexGrow: ratio, flexBasis: `${Math.round(ratio * rowHeight)}px` };
}
