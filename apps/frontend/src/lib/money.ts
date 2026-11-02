/** Format integer minor units (cents) as a localized currency string. */
export function formatMoney(cents: number, currency = 'usd'): string {
  // Pinned locale: the server and browser must format identically or hydration fails.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
