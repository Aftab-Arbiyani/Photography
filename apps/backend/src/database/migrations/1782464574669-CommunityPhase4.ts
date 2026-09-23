import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommunityPhase41782464574669 implements MigrationInterface {
  name = 'CommunityPhase41782464574669';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "slug" character varying(80) NOT NULL, "name" character varying(80) NOT NULL, "usage_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tags_slug" ON "tags" ("slug") `);
    await queryRunner.query(
      `CREATE TYPE "public"."share_events_target_type_enum" AS ENUM('photo', 'album', 'collection')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."share_events_channel_enum" AS ENUM('link', 'twitter', 'facebook', 'pinterest', 'whatsapp', 'email')`,
    );
    await queryRunner.query(
      `CREATE TABLE "share_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "target_type" "public"."share_events_target_type_enum" NOT NULL, "target_id" uuid NOT NULL, "channel" "public"."share_events_channel_enum" NOT NULL DEFAULT 'link', "user_id" uuid, "ip_address" character varying(64), CONSTRAINT "PK_43870adb21d3a0fcdb798fae692" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_share_events_target" ON "share_events" ("target_type", "target_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_target_type_enum" AS ENUM('photo', 'album', 'collection', 'comment', 'user')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_reason_enum" AS ENUM('spam', 'abuse', 'copyright', 'nudity', 'hate', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_status_enum" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "reporter_id" uuid NOT NULL, "target_type" "public"."reports_target_type_enum" NOT NULL, "target_id" uuid NOT NULL, "reason" "public"."reports_reason_enum" NOT NULL, "details" text, "status" "public"."reports_status_enum" NOT NULL DEFAULT 'pending', "resolved_by" uuid, "resolution_note" text, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_reports_target" ON "reports" ("target_type", "target_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_reports_status" ON "reports" ("status") `);
    await queryRunner.query(
      `CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "follower_id" uuid NOT NULL, "following_id" uuid NOT NULL, CONSTRAINT "uq_follows_pair" UNIQUE ("follower_id", "following_id"), CONSTRAINT "chk_follows_not_self" CHECK ("follower_id" <> "following_id"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_follows_following" ON "follows" ("following_id") `);
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "actor_id" uuid, "action" character varying(160) NOT NULL, "entity_type" character varying(80), "entity_id" character varying(64), "ip_address" character varying(64), "user_agent" character varying(512), "status_code" integer, "metadata" jsonb, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_actor" ON "audit_logs" ("actor_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."analytics_events_type_enum" AS ENUM('pageview', 'search', 'photo_view', 'album_view', 'add_to_cart', 'checkout')`,
    );
    await queryRunner.query(
      `CREATE TABLE "analytics_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "type" "public"."analytics_events_type_enum" NOT NULL, "visitor_id" character varying(64), "user_id" uuid, "path" character varying(512), "query" character varying(255), "referrer" character varying(512), "metadata" jsonb, CONSTRAINT "PK_5d643d67a09b55653e98616f421" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_analytics_visitor" ON "analytics_events" ("visitor_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_analytics_type_created" ON "analytics_events" ("type", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "photo_tags" ("tag_id" uuid NOT NULL, "photo_id" uuid NOT NULL, CONSTRAINT "PK_40d4103508d1d290f8e0af54cb8" PRIMARY KEY ("tag_id", "photo_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_899fc03d5ae6669e92c4ca93fa" ON "photo_tags" ("tag_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2bb7871d82754a42f7a076266" ON "photo_tags" ("photo_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "followers_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "following_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "photos" ADD "shares_count" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "photos" ADD "location_name" character varying(200)`);
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('purchase_success', 'download_ready', 'order_failed', 'refund_processed', 'review_reply', 'system', 'new_follower', 'new_comment', 'new_reply', 'photo_liked', 'report_received', 'report_resolved')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_54b5dc2739f2dea57900933db66" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photo_tags" ADD CONSTRAINT "FK_899fc03d5ae6669e92c4ca93fae" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "photo_tags" ADD CONSTRAINT "FK_a2bb7871d82754a42f7a076266c" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "photo_tags" DROP CONSTRAINT "FK_a2bb7871d82754a42f7a076266c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photo_tags" DROP CONSTRAINT "FK_899fc03d5ae6669e92c4ca93fae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_54b5dc2739f2dea57900933db66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('purchase_success', 'download_ready', 'order_failed', 'refund_processed', 'review_reply', 'system')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "location_name"`);
    await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "shares_count"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "following_count"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "followers_count"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a2bb7871d82754a42f7a076266"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_899fc03d5ae6669e92c4ca93fa"`);
    await queryRunner.query(`DROP TABLE "photo_tags"`);
    await queryRunner.query(`DROP INDEX "public"."idx_analytics_type_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_analytics_visitor"`);
    await queryRunner.query(`DROP TABLE "analytics_events"`);
    await queryRunner.query(`DROP TYPE "public"."analytics_events_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_actor"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_entity"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP INDEX "public"."idx_follows_following"`);
    await queryRunner.query(`DROP TABLE "follows"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reports_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reports_target"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reports_reason_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reports_target_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_share_events_target"`);
    await queryRunner.query(`DROP TABLE "share_events"`);
    await queryRunner.query(`DROP TYPE "public"."share_events_channel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."share_events_target_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_tags_slug"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
