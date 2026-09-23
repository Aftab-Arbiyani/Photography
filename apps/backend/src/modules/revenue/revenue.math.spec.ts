import { splitRevenue } from './revenue.math';

describe('splitRevenue', () => {
  it('splits gross by commission rate (70/30 default)', () => {
    expect(splitRevenue(10_000, 0.3)).toEqual({
      grossCents: 10_000,
      commissionCents: 3_000,
      netCents: 7_000,
    });
  });

  it('rounds to whole cents', () => {
    const split = splitRevenue(999, 0.3); // net = round(999*0.7)=699
    expect(split.netCents).toBe(699);
    expect(split.commissionCents).toBe(300);
    expect(split.netCents + split.commissionCents).toBe(999);
  });

  it('clamps the rate to [0,1]', () => {
    expect(splitRevenue(5_000, 1.5)).toEqual({
      grossCents: 5_000,
      commissionCents: 5_000,
      netCents: 0,
    });
    expect(splitRevenue(5_000, -1)).toEqual({
      grossCents: 5_000,
      commissionCents: 0,
      netCents: 5_000,
    });
  });

  it('zero gross yields zero everywhere', () => {
    expect(splitRevenue(0, 0.3)).toEqual({ grossCents: 0, commissionCents: 0, netCents: 0 });
  });

  it('commission + net always reconciles to gross', () => {
    for (const gross of [1, 7, 100, 1234, 99_999]) {
      for (const rate of [0, 0.1, 0.25, 0.333, 0.5, 0.99]) {
        const s = splitRevenue(gross, rate);
        expect(s.commissionCents + s.netCents).toBe(gross);
      }
    }
  });
});
