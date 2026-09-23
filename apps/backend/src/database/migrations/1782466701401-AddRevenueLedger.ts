import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Materialized revenue ledger: one immutable row per order-item revenue event
 * (sale/refund), commission split snapshotted. Additive — populated going
 * forward at fulfillment/refund and backfilled by a nightly reconciliation cron.
 */
export class AddRevenueLedger1782466701401 implements MigrationInterface {
  name = 'AddRevenueLedger1782466701401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "revenue_ledger" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "version" integer NOT NULL DEFAULT 1,
        "order_id" uuid NOT NULL,
        "order_item_id" uuid NOT NULL,
        "photographer_id" uuid NOT NULL,
        "type" varchar(16) NOT NULL DEFAULT 'sale',
        "gross_cents" integer NOT NULL,
        "commission_cents" integer NOT NULL,
        "net_cents" integer NOT NULL,
        "commission_rate" numeric(5,4) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'usd',
        CONSTRAINT "pk_revenue_ledger" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_revenue_ledger_photographer" ON "revenue_ledger" ("photographer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_revenue_ledger_order" ON "revenue_ledger" ("order_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_revenue_ledger_item_type" ON "revenue_ledger" ("order_item_id", "type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "revenue_ledger"`);
  }
}
