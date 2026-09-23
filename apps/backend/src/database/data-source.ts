import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';

// Load the monorepo-root .env so the CLI (run from apps/backend) sees the same vars.
loadEnv({ path: join(__dirname, '..', '..', '..', '..', '.env') });
loadEnv();

const toBool = (v?: string) => (v ? ['true', '1', 'yes'].includes(v.toLowerCase()) : false);

/**
 * Standalone DataSource used by the TypeORM CLI for migration generate/run/revert.
 * The runtime app builds its options from ConfigService (see database.module.ts),
 * but both resolve to the same connection.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: toBool(process.env.DATABASE_SSL) ? { rejectUnauthorized: false } : false,
  // Match both compiled (.js, used by the migration CLI) and source (.ts, used
  // by ts-node seeds). __dirname resolves to dist/ or src/ depending on runtime,
  // so each context only ever finds the files that actually exist there.
  entities: [join(__dirname, '..', '**', '*.entity.{js,ts}')],
  migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: toBool(process.env.DATABASE_LOGGING),
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
