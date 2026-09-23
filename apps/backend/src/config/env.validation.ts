import * as Joi from 'joi';

/**
 * Joi schema validating every environment variable the app depends on.
 * The app refuses to boot if required vars are missing/invalid — fail fast.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),

  // HTTP
  BACKEND_PORT: Joi.number().port().default(4000),
  API_GLOBAL_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().allow('').required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_LOGGING: Joi.boolean().default(false),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),
  REDIS_TTL: Joi.number().default(3600),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_VERIFICATION_SECRET: Joi.string().min(32).required(),
  JWT_VERIFICATION_EXPIRES_IN: Joi.string().default('1d'),
  JWT_RESET_SECRET: Joi.string().min(32).required(),
  JWT_RESET_EXPIRES_IN: Joi.string().default('1h'),

  // Google OAuth (optional — feature is disabled when absent)
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  GOOGLE_CALLBACK_URL: Joi.string().uri().allow('').default(''),

  // Mail
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().port().default(1025),
  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASSWORD: Joi.string().allow('').default(''),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_FROM_NAME: Joi.string().default('Photography Platform'),
  // Allow non-IANA TLDs (e.g. ...@photography.local) for local/dev senders.
  MAIL_FROM_ADDRESS: Joi.string()
    .email({ tlds: { allow: false } })
    .default('no-reply@photography.local'),

  // AWS S3 (optional — storage falls back to a no-op/local driver when absent)
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  AWS_S3_BUCKET: Joi.string().allow('').default(''),
  AWS_S3_PUBLIC_URL: Joi.string().allow('').default(''),
  AWS_S3_ENDPOINT: Joi.string().allow('').default(''),
  AWS_S3_FORCE_PATH_STYLE: Joi.boolean().default(false),

  // Throttling
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(120),

  // App
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Stripe (optional — payments disabled when absent)
  STRIPE_SECRET_KEY: Joi.string().allow('').default(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().allow('').default(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  STRIPE_API_VERSION: Joi.string().default('2024-06-20'),

  // Commerce
  COMMERCE_CURRENCY: Joi.string().length(3).default('usd'),
  COMMERCE_TAX_BASIS_POINTS: Joi.number().min(0).max(10000).default(0),
  COMMERCE_INVOICE_PREFIX: Joi.string().default('APT'),
  DOWNLOAD_DEFAULT_LIMIT: Joi.number().min(1).default(5),
  DOWNLOAD_EXPIRY_DAYS: Joi.number().min(1).default(365),
  DOWNLOAD_SIGNED_URL_TTL: Joi.number().min(30).default(300),
  WATERMARK_ENABLED: Joi.boolean().default(true),
  WATERMARK_TEXT: Joi.string().default('APERTURE — PREVIEW'),
});
