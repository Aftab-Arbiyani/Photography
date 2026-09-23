/** DI token for the shared ioredis client. Kept in its own file to avoid a
 *  circular import between redis.module.ts and redis.service.ts. */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
