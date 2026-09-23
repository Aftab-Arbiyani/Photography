import { MigrationInterface, QueryRunner } from 'typeorm';

/** Stripe Connect account id on photographer profiles for automated payouts. Additive. */
export class AddStripeConnectAccount1782466701402 implements MigrationInterface {
  name = 'AddStripeConnectAccount1782466701402';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "photographer_profiles" ADD COLUMN IF NOT EXISTS "stripe_account_id" varchar(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "photographer_profiles" DROP COLUMN IF EXISTS "stripe_account_id"`,
    );
  }
}
