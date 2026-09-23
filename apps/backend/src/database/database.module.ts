import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DatabaseConfig } from '../config/configuration';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = configService.getOrThrow<DatabaseConfig>('database');
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          ssl: db.ssl ? { rejectUnauthorized: false } : false,
          // Entities are auto-loaded from the feature modules that register them.
          autoLoadEntities: true,
          synchronize: db.synchronize,
          logging: db.logging,
          migrationsTableName: 'typeorm_migrations',
          // Retain connection resilience in containerized environments.
          retryAttempts: 10,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
