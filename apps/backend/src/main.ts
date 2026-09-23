// Initialize tracing/error-reporting before anything else so instrumentation
// can patch the runtime. No-op unless OTEL/Sentry env vars are configured.
import { initObservability } from './observability/tracing';
initObservability();

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { join } from 'node:path';
import type { AppConfig } from './config/configuration';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // Preserve the raw request body so Stripe webhook signatures can be verified.
    rawBody: true,
  });

  // Use pino as the framework logger.
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const { port, globalPrefix, apiVersion, corsOrigins, env } =
    configService.getOrThrow<AppConfig>('app');

  // ---- security & platform middleware ----
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.set('trust proxy', 1);

  // ---- routing: /api/v1/... ----
  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: apiVersion.replace(/^v/, '') });

  // Serve local-disk uploads when S3 is not configured.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: `/${globalPrefix}/${apiVersion}/uploads/`,
  });

  app.enableShutdownHooks();

  // ValidationPipe is also wired globally via APP_PIPE; reasserting defends
  // against any provider-ordering edge cases.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // ---- Swagger / OpenAPI ----
  if (env !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Aperture — Photography Platform API')
      .setDescription('Production REST API for the Aperture photography platform.')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addTag('auth')
      .addTag('users')
      .addTag('photos')
      .addTag('categories')
      .addTag('albums')
      .addTag('collections')
      .addTag('health')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${globalPrefix}/${apiVersion}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`🚀 API ready at http://localhost:${port}/${globalPrefix}/${apiVersion}`);
  logger.log(`📚 Swagger at http://localhost:${port}/${globalPrefix}/${apiVersion}/docs`);
}

void bootstrap();
