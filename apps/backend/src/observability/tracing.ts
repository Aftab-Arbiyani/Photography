/**
 * OpenTelemetry + Sentry bootstrap. MUST be imported before any other module
 * (especially before NestFactory) so auto-instrumentation can patch http/pg/etc.
 * Both are no-ops unless their env vars are set, so the app boots unchanged in dev.
 *
 *   OTEL: set OTEL_EXPORTER_OTLP_ENDPOINT (e.g. http://localhost:4318)
 *   Sentry: set SENTRY_DSN
 */
import * as Sentry from '@sentry/node';

let started = false;

export function initObservability(): void {
  if (started) return;
  started = true;

  // --- Sentry ---
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    });
    // eslint-disable-next-line no-console
    console.log('[observability] Sentry enabled');
  }

  // --- OpenTelemetry ---
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (otlpEndpoint) {
    // Lazily required so the (heavy) OTel deps load only when tracing is on.
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { resourceFromAttributes } = require('@opentelemetry/resources');
    const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');
    /* eslint-enable @typescript-eslint/no-var-requires */

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'aperture-api',
      }),
      traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
    // eslint-disable-next-line no-console
    console.log('[observability] OpenTelemetry tracing enabled');

    const shutdown = () => {
      sdk.shutdown().finally(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

export { Sentry };
