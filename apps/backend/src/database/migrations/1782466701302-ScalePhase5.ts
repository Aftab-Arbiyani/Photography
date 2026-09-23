import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScalePhase51782466701302 implements MigrationInterface {
  name = 'ScalePhase51782466701302';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_interval_enum" AS ENUM('month', 'year')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "code" character varying(64) NOT NULL, "name" character varying(120) NOT NULL, "description" text, "price_cents" integer NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'usd', "interval" "public"."subscription_plans_interval_enum" NOT NULL DEFAULT 'month', "features" jsonb NOT NULL DEFAULT '[]'::jsonb, "is_premium" boolean NOT NULL DEFAULT false, "stripe_price_id" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_subscription_plans_code" ON "subscription_plans" ("code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'incomplete')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "plan_id" uuid NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'incomplete', "stripe_subscription_id" character varying(255), "stripe_customer_id" character varying(255), "current_period_end" TIMESTAMP WITH TIME ZONE, "cancel_at_period_end" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_subscriptions_stripe" ON "subscriptions" ("stripe_subscription_id") WHERE "stripe_subscription_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_status" ON "subscriptions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_user" ON "subscriptions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payouts_status_enum" AS ENUM('requested', 'processing', 'paid', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payouts_method_enum" AS ENUM('stripe', 'paypal', 'bank')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "photographer_id" uuid NOT NULL, "amount_cents" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'usd', "status" "public"."payouts_status_enum" NOT NULL DEFAULT 'requested', "method" "public"."payouts_method_enum" NOT NULL DEFAULT 'stripe', "reference" character varying(255), "processed_by" uuid, "processed_at" TIMESTAMP WITH TIME ZONE, "failure_reason" text, CONSTRAINT "PK_76855dc4f0a6c18c72eea302e87" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_payouts_status" ON "payouts" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "idx_payouts_photographer" ON "payouts" ("photographer_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "platform_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "key" character varying(120) NOT NULL, "value" jsonb NOT NULL, "category" character varying(64) NOT NULL DEFAULT 'general', "description" text, "is_public" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_2934aeb70ec285196dcab4a2e96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_platform_settings_key" ON "platform_settings" ("key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feature_flags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "key" character varying(120) NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "description" text, "rollout_percentage" integer NOT NULL DEFAULT '100', CONSTRAINT "PK_db657d344e9caacfc9d5cf8bbac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_feature_flags_key" ON "feature_flags" ("key") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cms_pages_status_enum" AS ENUM('draft', 'published')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cms_pages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "slug" character varying(160) NOT NULL, "title" character varying(200) NOT NULL, "body" text NOT NULL, "status" "public"."cms_pages_status_enum" NOT NULL DEFAULT 'draft', "meta_title" character varying(200), "meta_description" character varying(320), CONSTRAINT "PK_a6bd4d97252f8f122d34bc6bce6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_cms_pages_slug" ON "cms_pages" ("slug") `);
    await queryRunner.query(
      `CREATE TABLE "email_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "key" character varying(120) NOT NULL, "subject" character varying(200) NOT NULL, "html_body" text NOT NULL, "variables" jsonb NOT NULL DEFAULT '[]'::jsonb, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_06c564c515d8cdb40b6f3bfbbb4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_email_templates_key" ON "email_templates" ("key") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."photographer_profiles_verificationstatus_enum" AS ENUM('unverified', 'pending', 'verified', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."photographer_profiles_payout_method_enum" AS ENUM('stripe', 'paypal', 'bank')`,
    );
    await queryRunner.query(
      `CREATE TABLE "photographer_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "headline" character varying(160), "verificationStatus" "public"."photographer_profiles_verificationstatus_enum" NOT NULL DEFAULT 'unverified', "verified_at" TIMESTAMP WITH TIME ZONE, "commission_rate" numeric(4,3) NOT NULL DEFAULT '0.3', "payout_method" "public"."photographer_profiles_payout_method_enum", "payout_details" jsonb, "paid_out_cents" bigint NOT NULL DEFAULT '0', CONSTRAINT "REL_bd5465c00833067b0a7b2f10c9" UNIQUE ("user_id"), CONSTRAINT "PK_092565244905d812964ad92328f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_photographer_profiles_user" ON "photographer_profiles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."photographer_applications_status_enum" AS ENUM('pending', 'under_review', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "photographer_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "status" "public"."photographer_applications_status_enum" NOT NULL DEFAULT 'pending', "statement" text, "portfolio_url" text, "reviewed_by" uuid, "review_note" text, CONSTRAINT "PK_7b7ee35acf40b70fc1695f18666" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_photographer_applications_user" ON "photographer_applications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_photographer_applications_status" ON "photographer_applications" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD CONSTRAINT "FK_6d76ef689d5900d21f59f845a2f" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photographer_profiles" ADD CONSTRAINT "FK_bd5465c00833067b0a7b2f10c9b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photographer_applications" ADD CONSTRAINT "FK_cc948d38bf21f4746a936a6d00b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "photographer_applications" DROP CONSTRAINT "FK_cc948d38bf21f4746a936a6d00b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photographer_profiles" DROP CONSTRAINT "FK_bd5465c00833067b0a7b2f10c9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP CONSTRAINT "FK_6d76ef689d5900d21f59f845a2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_photographer_applications_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_photographer_applications_user"`);
    await queryRunner.query(`DROP TABLE "photographer_applications"`);
    await queryRunner.query(`DROP TYPE "public"."photographer_applications_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_photographer_profiles_user"`);
    await queryRunner.query(`DROP TABLE "photographer_profiles"`);
    await queryRunner.query(`DROP TYPE "public"."photographer_profiles_payout_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."photographer_profiles_verificationstatus_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_email_templates_key"`);
    await queryRunner.query(`DROP TABLE "email_templates"`);
    await queryRunner.query(`DROP INDEX "public"."uq_cms_pages_slug"`);
    await queryRunner.query(`DROP TABLE "cms_pages"`);
    await queryRunner.query(`DROP TYPE "public"."cms_pages_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_feature_flags_key"`);
    await queryRunner.query(`DROP TABLE "feature_flags"`);
    await queryRunner.query(`DROP INDEX "public"."uq_platform_settings_key"`);
    await queryRunner.query(`DROP TABLE "platform_settings"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payouts_photographer"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payouts_status"`);
    await queryRunner.query(`DROP TABLE "payouts"`);
    await queryRunner.query(`DROP TYPE "public"."payouts_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payouts_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_subscriptions_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX "public"."uq_subscriptions_stripe"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_subscription_plans_code"`);
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
    await queryRunner.query(`DROP TYPE "public"."subscription_plans_interval_enum"`);
  }
}
