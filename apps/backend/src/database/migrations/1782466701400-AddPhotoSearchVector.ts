import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Postgres full-text search for photos. Adds a STORED generated tsvector
 * (weighted title > location > description > story) plus a GIN index, replacing
 * the previous ILIKE scans with relevance-ranked, index-backed search.
 * Additive only — generated column is maintained by Postgres, no app writes.
 */
export class AddPhotoSearchVector1782466701400 implements MigrationInterface {
  name = 'AddPhotoSearchVector1782466701400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "photos"
      ADD COLUMN IF NOT EXISTS "search_vector" tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("location_name", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("description", '')), 'C') ||
        setweight(to_tsvector('english', coalesce("story", '')), 'D')
      ) STORED
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_photos_search_vector" ON "photos" USING GIN ("search_vector")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_photos_search_vector"`);
    await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN IF EXISTS "search_vector"`);
  }
}
