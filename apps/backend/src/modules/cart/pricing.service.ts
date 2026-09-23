import { Injectable } from '@nestjs/common';
import type { CartTotals } from '@photography/types';

export interface PricingLine {
  /** list price before any album-level discount */
  originalCents: number;
  /** price after album-level discount (== original when no discount) */
  effectiveCents: number;
}

export interface ComputeTotalsInput {
  lines: PricingLine[];
  couponCents?: number;
  couponCode?: string | null;
  taxBasisPoints: number;
  currency: string;
}

/**
 * Pure money math for carts and orders. No I/O — fully unit-testable.
 * Order of operations: album discounts → coupon → tax. All values are integer cents.
 */
@Injectable()
export class PricingService {
  /** Apply an album-level discount percentage to a price (integer-cents safe). */
  static applyDiscount(priceCents: number, discountPercent: number, active: boolean): number {
    if (!active || discountPercent <= 0) return priceCents;
    const pct = Math.min(Math.max(discountPercent, 0), 100);
    return Math.round((priceCents * (100 - pct)) / 100);
  }

  computeTotals({
    lines,
    couponCents = 0,
    couponCode = null,
    taxBasisPoints,
    currency,
  }: ComputeTotalsInput): CartTotals {
    const subtotalCents = lines.reduce((sum, l) => sum + l.originalCents, 0);
    const afterAlbumDiscount = lines.reduce((sum, l) => sum + l.effectiveCents, 0);
    const discountCents = subtotalCents - afterAlbumDiscount;

    const coupon = Math.min(Math.max(couponCents, 0), afterAlbumDiscount);
    const taxableBase = afterAlbumDiscount - coupon;
    const taxCents = Math.round((taxableBase * taxBasisPoints) / 10000);
    const totalCents = taxableBase + taxCents;

    return {
      subtotalCents,
      discountCents,
      couponCents: coupon,
      taxCents,
      totalCents,
      currency,
      couponCode: coupon > 0 ? couponCode : null,
    };
  }
}
