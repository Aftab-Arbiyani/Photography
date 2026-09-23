import { MigrationInterface, QueryRunner } from 'typeorm';

export class MarketplacePhase31782460849771 implements MigrationInterface {
  name = 'MarketplacePhase31782460849771';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "wishlist_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "album_id" uuid NOT NULL, CONSTRAINT "uq_wishlist_user_album" UNIQUE ("user_id", "album_id"), CONSTRAINT "PK_0bd52924a97cda208ed2a07bd69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_wishlist_user" ON "wishlist_items" ("user_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."reviews_status_enum" AS ENUM('published', 'hidden', 'flagged')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "album_id" uuid NOT NULL, "user_id" uuid NOT NULL, "rating" integer NOT NULL, "title" character varying(160), "body" text, "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'published', "is_verified_purchase" boolean NOT NULL DEFAULT false, CONSTRAINT "uq_reviews_user_album" UNIQUE ("user_id", "album_id"), CONSTRAINT "chk_reviews_rating" CHECK (rating >= 1 AND rating <= 5), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_reviews_album" ON "reviews" ("album_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."order_items_license_type_enum" AS ENUM('personal', 'standard', 'extended', 'exclusive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "order_id" uuid NOT NULL, "album_id" uuid NOT NULL, "pricing_id" uuid, "photographer_id" uuid NOT NULL, "album_title" character varying(200) NOT NULL, "pricing_name" character varying(120) NOT NULL, "license_type" "public"."order_items_license_type_enum" NOT NULL, "unit_price_cents" integer NOT NULL, "download_limit" integer NOT NULL DEFAULT '5', "includes_raw" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_photographer" ON "order_items" ("photographer_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "invoice_number" character varying(40) NOT NULL, "user_id" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "subtotal_cents" integer NOT NULL DEFAULT '0', "discount_cents" integer NOT NULL DEFAULT '0', "coupon_cents" integer NOT NULL DEFAULT '0', "tax_cents" integer NOT NULL DEFAULT '0', "total_cents" integer NOT NULL DEFAULT '0', "refunded_cents" integer NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'usd', "coupon_code" character varying(64), "billing_email" character varying(254) NOT NULL, "stripe_payment_intent_id" character varying(255), "stripe_charge_id" character varying(255), "paid_at" TIMESTAMP WITH TIME ZONE, "failed_at" TIMESTAMP WITH TIME ZONE, "refunded_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_orders_invoice_number" ON "orders" ("invoice_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_payment_intent" ON "orders" ("stripe_payment_intent_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders" ("status") `);
    await queryRunner.query(`CREATE INDEX "idx_orders_user" ON "orders" ("user_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."entitlements_license_type_enum" AS ENUM('personal', 'standard', 'extended', 'exclusive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "entitlements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "album_id" uuid NOT NULL, "order_id" uuid NOT NULL, "license_type" "public"."entitlements_license_type_enum" NOT NULL, "download_limit" integer NOT NULL DEFAULT '5', "downloads_used" integer NOT NULL DEFAULT '0', "includes_raw" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_6a45cb6f5747d49365a879bffde" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_entitlements_user_album" ON "entitlements" ("user_id", "album_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_entitlements_user" ON "entitlements" ("user_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('purchase_success', 'download_ready', 'order_failed', 'refund_processed', 'review_reply', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(200) NOT NULL, "body" text, "link_url" text, "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id", "read_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."album_assets_type_enum" AS ENUM('high_res', 'zip', 'exclusive', 'raw')`,
    );
    await queryRunner.query(
      `CREATE TABLE "album_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "album_id" uuid NOT NULL, "type" "public"."album_assets_type_enum" NOT NULL DEFAULT 'high_res', "storage_key" text NOT NULL, "file_name" character varying(255) NOT NULL, "content_type" character varying(120) NOT NULL DEFAULT 'application/octet-stream', "size_bytes" bigint NOT NULL DEFAULT '0', "requires_raw" boolean NOT NULL DEFAULT false, "watermarkable" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ef5d23d5d1a38393aa1f4017fd8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_album_assets_album" ON "album_assets" ("album_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "downloads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "entitlement_id" uuid NOT NULL, "user_id" uuid NOT NULL, "asset_id" uuid NOT NULL, "ip_address" character varying(64), "user_agent" character varying(512), "device_fingerprint" character varying(128), "signed_url_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "watermarked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_60f7fa2aa9b7138737ab957a436" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_downloads_entitlement" ON "downloads" ("entitlement_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_downloads_user" ON "downloads" ("user_id") `);
    await queryRunner.query(`CREATE TYPE "public"."coupons_type_enum" AS ENUM('percent', 'fixed')`);
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "code" character varying(64) NOT NULL, "type" "public"."coupons_type_enum" NOT NULL DEFAULT 'percent', "value" integer NOT NULL, "min_subtotal_cents" integer NOT NULL DEFAULT '0', "max_redemptions" integer, "redeemed_count" integer NOT NULL DEFAULT '0', "valid_from" TIMESTAMP WITH TIME ZONE, "valid_until" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_coupons_code" ON "coupons" ("code") `);
    await queryRunner.query(
      `CREATE TYPE "public"."album_pricing_license_type_enum" AS ENUM('personal', 'standard', 'extended', 'exclusive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "album_pricing" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "album_id" uuid NOT NULL, "name" character varying(120) NOT NULL, "license_type" "public"."album_pricing_license_type_enum" NOT NULL DEFAULT 'standard', "price_cents" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'usd', "download_limit" integer NOT NULL DEFAULT '5', "includes_raw" boolean NOT NULL DEFAULT false, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_48352f3ce7da5ddd9961e5b7a32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_album_pricing_album" ON "album_pricing" ("album_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "cart_id" uuid NOT NULL, "album_id" uuid NOT NULL, "pricing_id" uuid NOT NULL, CONSTRAINT "uq_cart_items_cart_album" UNIQUE ("cart_id", "album_id"), CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_cart_items_cart" ON "cart_items" ("cart_id") `);
    await queryRunner.query(
      `CREATE TABLE "carts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "coupon_id" uuid, CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_carts_user" ON "carts" ("user_id") `);
    await queryRunner.query(
      `ALTER TABLE "albums" ADD "is_for_sale" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums" ADD "is_featured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "albums" ADD "trailer_url" text`);
    await queryRunner.query(
      `ALTER TABLE "albums" ADD "discount_percent" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums" ADD "discount_active" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums" ADD "rating_average" numeric(3,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "albums" ADD "rating_count" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "albums" ADD "sales_count" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`CREATE INDEX "idx_albums_featured" ON "albums" ("is_featured") `);
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_549f44d8b756e2690deb099f83b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_df63842f53fb5f2b8dd3a157e2a" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_730212b061cf96c78ef79c8dacc" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_50aa7579faaea70c1b1353a9167" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entitlements" ADD CONSTRAINT "FK_30d2208c43f245217c03cb7ce31" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entitlements" ADD CONSTRAINT "FK_f02e72c0ac67bc26f5bae731656" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entitlements" ADD CONSTRAINT "FK_2bcf957bdebe6fc27c5353480f4" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "album_assets" ADD CONSTRAINT "FK_6e3b7580d4f5c9053717c2d6b55" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "downloads" ADD CONSTRAINT "FK_ca09b5bb6c70ae8598b6226ab9c" FOREIGN KEY ("entitlement_id") REFERENCES "entitlements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "downloads" ADD CONSTRAINT "FK_b63bbc96bc5056e8b85ce020a4b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "downloads" ADD CONSTRAINT "FK_38c87bc3737a5157eb9f97f8eef" FOREIGN KEY ("asset_id") REFERENCES "album_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "album_pricing" ADD CONSTRAINT "FK_1bedcacc8506cd64664cdfdd370" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_7e48f3b768c12b2d3f1cd627602" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_e2eba8bbf19c03c4373177b0d28" FOREIGN KEY ("pricing_id") REFERENCES "album_pricing"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_f1f73556b14ea09a1c7182a7fba" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_f1f73556b14ea09a1c7182a7fba"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea"`);
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_e2eba8bbf19c03c4373177b0d28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_7e48f3b768c12b2d3f1cd627602"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`,
    );
    await queryRunner.query(
      `ALTER TABLE "album_pricing" DROP CONSTRAINT "FK_1bedcacc8506cd64664cdfdd370"`,
    );
    await queryRunner.query(
      `ALTER TABLE "downloads" DROP CONSTRAINT "FK_38c87bc3737a5157eb9f97f8eef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "downloads" DROP CONSTRAINT "FK_b63bbc96bc5056e8b85ce020a4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "downloads" DROP CONSTRAINT "FK_ca09b5bb6c70ae8598b6226ab9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "album_assets" DROP CONSTRAINT "FK_6e3b7580d4f5c9053717c2d6b55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entitlements" DROP CONSTRAINT "FK_2bcf957bdebe6fc27c5353480f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entitlements" DROP CONSTRAINT "FK_f02e72c0ac67bc26f5bae731656"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entitlements" DROP CONSTRAINT "FK_30d2208c43f245217c03cb7ce31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_50aa7579faaea70c1b1353a9167"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_730212b061cf96c78ef79c8dacc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_df63842f53fb5f2b8dd3a157e2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_549f44d8b756e2690deb099f83b"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_albums_featured"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "sales_count"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "rating_count"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "rating_average"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "discount_active"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "discount_percent"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "trailer_url"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "is_featured"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "is_for_sale"`);
    await queryRunner.query(`DROP INDEX "public"."uq_carts_user"`);
    await queryRunner.query(`DROP TABLE "carts"`);
    await queryRunner.query(`DROP INDEX "public"."idx_cart_items_cart"`);
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP INDEX "public"."idx_album_pricing_album"`);
    await queryRunner.query(`DROP TABLE "album_pricing"`);
    await queryRunner.query(`DROP TYPE "public"."album_pricing_license_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_coupons_code"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "public"."coupons_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_downloads_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_downloads_entitlement"`);
    await queryRunner.query(`DROP TABLE "downloads"`);
    await queryRunner.query(`DROP INDEX "public"."idx_album_assets_album"`);
    await queryRunner.query(`DROP TABLE "album_assets"`);
    await queryRunner.query(`DROP TYPE "public"."album_assets_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_notifications_user"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_entitlements_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_entitlements_user_album"`);
    await queryRunner.query(`DROP TABLE "entitlements"`);
    await queryRunner.query(`DROP TYPE "public"."entitlements_license_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_payment_intent"`);
    await queryRunner.query(`DROP INDEX "public"."uq_orders_invoice_number"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_order_items_order"`);
    await queryRunner.query(`DROP INDEX "public"."idx_order_items_photographer"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TYPE "public"."order_items_license_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reviews_album"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TYPE "public"."reviews_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_wishlist_user"`);
    await queryRunner.query(`DROP TABLE "wishlist_items"`);
  }
}
