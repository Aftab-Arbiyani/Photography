import { Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';

type ThrottlerRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

/** Suppression window for the "Redis unavailable" warning, so an outage can't flood the logs. */
const WARN_INTERVAL_MS = 30_000;

/**
 * Wraps a ThrottlerStorage and fails open when the backing store errors.
 *
 * Rate limiting is a protective measure, not a correctness invariant: if Redis is
 * unreachable or refusing writes (e.g. MISCONF after a failed RDB save), a throwing
 * storage turns every throttled route — including POST /auth/login — into a 500.
 * Allowing the request through instead trades a temporary gap in rate limiting for
 * a working API, and logs loudly so the outage is still visible.
 */
export class FailOpenThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(FailOpenThrottlerStorage.name);
  private lastWarnAt = 0;

  constructor(private readonly delegate: ThrottlerStorage) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerRecord> {
    try {
      return await this.delegate.increment(key, ttl, limit, blockDuration, throttlerName);
    } catch (error) {
      this.warnOnce(error as Error);
      // isBlocked: false lets ThrottlerGuard pass the request through.
      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
    }
  }

  private warnOnce(error: Error): void {
    const now = Date.now();
    if (now - this.lastWarnAt < WARN_INTERVAL_MS) return;
    this.lastWarnAt = now;
    this.logger.warn(
      `Throttler storage unavailable — rate limiting is failing open: ${error.message}`,
    );
  }
}
