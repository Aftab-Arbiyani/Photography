/**
 * Pure revenue-split math (no I/O) so it can be unit-tested and reused.
 * `commissionRate` is the platform's cut in [0,1]; the photographer nets the rest.
 * All amounts are integer minor units (cents).
 */
export interface RevenueSplit {
  grossCents: number;
  commissionCents: number;
  netCents: number;
}

export function splitRevenue(grossCents: number, commissionRate: number): RevenueSplit {
  const rate = Math.min(Math.max(commissionRate, 0), 1);
  const netCents = Math.round(grossCents * (1 - rate));
  return { grossCents, commissionCents: grossCents - netCents, netCents };
}
