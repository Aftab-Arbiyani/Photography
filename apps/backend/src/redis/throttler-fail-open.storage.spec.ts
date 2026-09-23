import { Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { FailOpenThrottlerStorage } from './throttler-fail-open.storage';

describe('FailOpenThrottlerStorage', () => {
  const args = ['key', 60_000, 10, 0, 'default'] as const;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes the delegate record through when the store is healthy', async () => {
    const record = { totalHits: 3, timeToExpire: 42, isBlocked: false, timeToBlockExpire: 0 };
    const delegate = { increment: jest.fn().mockResolvedValue(record) } as ThrottlerStorage;

    const storage = new FailOpenThrottlerStorage(delegate);

    await expect(storage.increment(...args)).resolves.toEqual(record);
    expect(delegate.increment).toHaveBeenCalledWith(...args);
  });

  it('still blocks when the delegate reports the limit is exceeded', async () => {
    const record = { totalHits: 11, timeToExpire: 5, isBlocked: true, timeToBlockExpire: 5 };
    const delegate = { increment: jest.fn().mockResolvedValue(record) } as ThrottlerStorage;

    await expect(new FailOpenThrottlerStorage(delegate).increment(...args)).resolves.toEqual(
      record,
    );
  });

  it('fails open with an unblocked record when the delegate throws', async () => {
    const delegate = {
      increment: jest.fn().mockRejectedValue(new Error('MISCONF Redis is configured to save...')),
    } as ThrottlerStorage;

    await expect(new FailOpenThrottlerStorage(delegate).increment(...args)).resolves.toEqual({
      totalHits: 0,
      timeToExpire: 0,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
  });

  it('suppresses repeat warnings so an outage cannot flood the logs', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const delegate = {
      increment: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    } as ThrottlerStorage;

    const storage = new FailOpenThrottlerStorage(delegate);
    for (let i = 0; i < 5; i += 1) {
      await storage.increment(...args);
    }

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('failing open');
  });
});
