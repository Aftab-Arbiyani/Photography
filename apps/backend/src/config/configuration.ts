import { registerAs } from '@nestjs/config';

const toBool = (v: string | undefined, fallback = false): boolean =>
  v === undefined ? fallback : ['true', '1', 'yes'].includes(v.toLowerCase());

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.BACKEND_PORT ?? '4000', 10),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? 'v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: toBool(process.env.DATABASE_SSL),
  logging: toBool(process.env.DATABASE_LOGGING),
  synchronize: toBool(process.env.DATABASE_SYNCHRONIZE),
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
  ttl: parseInt(process.env.REDIS_TTL ?? '3600', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  verificationSecret: process.env.JWT_VERIFICATION_SECRET as string,
  verificationExpiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN ?? '1d',
  resetSecret: process.env.JWT_RESET_SECRET as string,
  resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN ?? '1h',
}));

export const googleConfig = registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
}));

export const mailConfig = registerAs('mail', () => ({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT ?? '1025', 10),
  user: process.env.MAIL_USER || undefined,
  password: process.env.MAIL_PASSWORD || undefined,
  secure: toBool(process.env.MAIL_SECURE),
  fromName: process.env.MAIL_FROM_NAME ?? 'Photography Platform',
  fromAddress: process.env.MAIL_FROM_ADDRESS ?? 'no-reply@photography.local',
}));

export const storageConfig = registerAs('storage', () => ({
  region: process.env.AWS_REGION ?? 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucket: process.env.AWS_S3_BUCKET || '',
  publicUrl: process.env.AWS_S3_PUBLIC_URL || '',
  endpoint: process.env.AWS_S3_ENDPOINT || undefined,
  forcePathStyle: toBool(process.env.AWS_S3_FORCE_PATH_STYLE),
  enabled: Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID),
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
}));

export const stripeConfig = registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  apiVersion: process.env.STRIPE_API_VERSION || '2024-06-20',
  enabled: Boolean(process.env.STRIPE_SECRET_KEY),
}));

export const commerceConfig = registerAs('commerce', () => ({
  currency: (process.env.COMMERCE_CURRENCY ?? 'usd').toLowerCase(),
  // Tax rate as basis points (e.g. 0 = none, 850 = 8.5%).
  taxBasisPoints: parseInt(process.env.COMMERCE_TAX_BASIS_POINTS ?? '0', 10),
  invoicePrefix: process.env.COMMERCE_INVOICE_PREFIX ?? 'APT',
  // Default download policy (per-pricing-tier overrides win).
  defaultDownloadLimit: parseInt(process.env.DOWNLOAD_DEFAULT_LIMIT ?? '5', 10),
  downloadExpiryDays: parseInt(process.env.DOWNLOAD_EXPIRY_DAYS ?? '365', 10),
  signedUrlTtlSeconds: parseInt(process.env.DOWNLOAD_SIGNED_URL_TTL ?? '300', 10),
  // Visible preview + buyer-email watermark toggles.
  watermarkEnabled: toBool(process.env.WATERMARK_ENABLED, true),
  watermarkText: process.env.WATERMARK_TEXT ?? 'APERTURE — PREVIEW',
}));

export const configurations = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  googleConfig,
  mailConfig,
  storageConfig,
  throttleConfig,
  stripeConfig,
  commerceConfig,
];

// Strongly-typed config shapes (used with ConfigService<AppConfigShape>).
export type AppConfig = ReturnType<typeof appConfig>;
export type DatabaseConfig = ReturnType<typeof databaseConfig>;
export type RedisConfig = ReturnType<typeof redisConfig>;
export type JwtConfig = ReturnType<typeof jwtConfig>;
export type GoogleConfig = ReturnType<typeof googleConfig>;
export type MailConfig = ReturnType<typeof mailConfig>;
export type StorageConfig = ReturnType<typeof storageConfig>;
export type ThrottleConfig = ReturnType<typeof throttleConfig>;
export type StripeConfig = ReturnType<typeof stripeConfig>;
export type CommerceConfig = ReturnType<typeof commerceConfig>;
