import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enables the Postgres extensions the schema depends on:
 *  - uuid-ossp : uuid_generate_v4() for primary keys
 *  - citext    : case-insensitive email column on users
 *
 * This MUST run before the generated schema migration (early timestamp ensures it).
 */
export class EnableExtensions1700000000000 implements MigrationInterface {
  name = 'EnableExtensions1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "citext";');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP EXTENSION IF EXISTS "citext";');
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
  }
}
