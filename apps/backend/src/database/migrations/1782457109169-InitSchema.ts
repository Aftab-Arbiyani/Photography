import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1782457109169 implements MigrationInterface {
  name = 'InitSchema1782457109169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "description" text, "cover_photo_id" uuid, "photos_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_categories_slug" ON "categories" ("slug") `);
    await queryRunner.query(
      `CREATE TYPE "public"."albums_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "albums" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "title" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "description" text, "status" "public"."albums_status_enum" NOT NULL DEFAULT 'draft', "cover_photo_id" uuid, "photos_count" integer NOT NULL DEFAULT '0', "published_at" TIMESTAMP WITH TIME ZONE, "photographer_id" uuid NOT NULL, CONSTRAINT "PK_838ebae24d2e12082670ffc95d7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_albums_slug" ON "albums" ("slug") `);
    await queryRunner.query(
      `CREATE INDEX "idx_albums_photographer" ON "albums" ("photographer_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collections_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "collections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "title" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "description" text, "status" "public"."collections_status_enum" NOT NULL DEFAULT 'draft', "cover_photo_id" uuid, "is_curated" boolean NOT NULL DEFAULT false, "photos_count" integer NOT NULL DEFAULT '0', "curator_id" uuid, CONSTRAINT "PK_21c00b1ebbd41ba1354242c5c4e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_collections_slug" ON "collections" ("slug") `);
    await queryRunner.query(
      `CREATE TABLE "likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "photo_id" uuid NOT NULL, CONSTRAINT "uq_likes_user_photo" UNIQUE ("user_id", "photo_id"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_likes_photo" ON "likes" ("photo_id") `);
    await queryRunner.query(
      `CREATE TABLE "bookmarks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "user_id" uuid NOT NULL, "photo_id" uuid NOT NULL, CONSTRAINT "uq_bookmarks_user_photo" UNIQUE ("user_id", "photo_id"), CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_bookmarks_user" ON "bookmarks" ("user_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."comments_status_enum" AS ENUM('visible', 'hidden', 'flagged')`,
    );
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "body" text NOT NULL, "status" "public"."comments_status_enum" NOT NULL DEFAULT 'visible', "photo_id" uuid NOT NULL, "author_id" uuid NOT NULL, "parent_id" uuid, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_comments_photo" ON "comments" ("photo_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."photos_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "title" character varying(200) NOT NULL, "slug" character varying(160) NOT NULL, "description" text, "story" text, "status" "public"."photos_status_enum" NOT NULL DEFAULT 'draft', "width" integer NOT NULL, "height" integer NOT NULL, "aspect_ratio" real NOT NULL DEFAULT '1', "storage_key" text NOT NULL, "thumbnail_key" text, "webp_key" text, "avif_key" text, "blur_data_url" text, "camera_make" character varying(120), "camera_model" character varying(120), "lens_model" character varying(160), "iso" integer, "shutter_speed" character varying(32), "aperture" real, "focal_length" real, "taken_at" TIMESTAMP WITH TIME ZONE, "gps_latitude" double precision, "gps_longitude" double precision, "exif_raw" jsonb, "likes_count" integer NOT NULL DEFAULT '0', "comments_count" integer NOT NULL DEFAULT '0', "views_count" integer NOT NULL DEFAULT '0', "is_featured" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP WITH TIME ZONE, "photographer_id" uuid NOT NULL, "category_id" uuid, "album_id" uuid, CONSTRAINT "PK_5220c45b8e32d49d767b9b3d725" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_photos_slug" ON "photos" ("slug") `);
    await queryRunner.query(`CREATE INDEX "idx_photos_album" ON "photos" ("album_id") `);
    await queryRunner.query(`CREATE INDEX "idx_photos_category" ON "photos" ("category_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_photos_photographer" ON "photos" ("photographer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_photos_status_published" ON "photos" ("status", "published_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "token_hash" character varying(128) NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by_token_id" uuid, "user_agent" character varying(255), "ip_address" character varying(64), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'photographer', 'user')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "email" citext NOT NULL, "password_hash" character varying(255), "first_name" character varying(100), "last_name" character varying(100), "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local', "google_id" character varying(255), "avatar_url" text, "bio" text, "is_email_verified" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_google_id" ON "users" ("google_id") WHERE "google_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "collection_photos" ("collection_id" uuid NOT NULL, "photo_id" uuid NOT NULL, CONSTRAINT "PK_d261b6b2c12cb4637da53e23b7a" PRIMARY KEY ("collection_id", "photo_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c0848842ac676995d5631bcc4" ON "collection_photos" ("collection_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2db7fbdb642dbda29e1838632c" ON "collection_photos" ("photo_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "albums" ADD CONSTRAINT "FK_237378cbab16e3253ca07a68bbe" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD CONSTRAINT "FK_69d24f76aa694ed6756ee9103f3" FOREIGN KEY ("curator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_3f519ed95f775c781a254089171" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_129aa81f3def44f65b896d37e4b" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_58a0fbaee65cd8959a870ee678c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_34a29d2a24f2136d7b44d7de0eb" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_0e5021e2518ea59f2efaf051500" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_d6f93329801a93536da4241e386" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" ADD CONSTRAINT "FK_3811669e6fb07fa931be040623e" FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" ADD CONSTRAINT "FK_1d2789b3ab2cc4b37cb81fd1273" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" ADD CONSTRAINT "FK_46e00f649a90c9f5cdcc45c5059" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_photos" ADD CONSTRAINT "FK_0c0848842ac676995d5631bcc4d" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_photos" ADD CONSTRAINT "FK_2db7fbdb642dbda29e1838632cc" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection_photos" DROP CONSTRAINT "FK_2db7fbdb642dbda29e1838632cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_photos" DROP CONSTRAINT "FK_0c0848842ac676995d5631bcc4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" DROP CONSTRAINT "FK_46e00f649a90c9f5cdcc45c5059"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" DROP CONSTRAINT "FK_1d2789b3ab2cc4b37cb81fd1273"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" DROP CONSTRAINT "FK_3811669e6fb07fa931be040623e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_d6f93329801a93536da4241e386"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_0e5021e2518ea59f2efaf051500"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_34a29d2a24f2136d7b44d7de0eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_58a0fbaee65cd8959a870ee678c"`,
    );
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_129aa81f3def44f65b896d37e4b"`);
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_3f519ed95f775c781a254089171"`);
    await queryRunner.query(
      `ALTER TABLE "collections" DROP CONSTRAINT "FK_69d24f76aa694ed6756ee9103f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums" DROP CONSTRAINT "FK_237378cbab16e3253ca07a68bbe"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_2db7fbdb642dbda29e1838632c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0c0848842ac676995d5631bcc4"`);
    await queryRunner.query(`DROP TABLE "collection_photos"`);
    await queryRunner.query(`DROP INDEX "public"."uq_users_google_id"`);
    await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."idx_photos_status_published"`);
    await queryRunner.query(`DROP INDEX "public"."idx_photos_photographer"`);
    await queryRunner.query(`DROP INDEX "public"."idx_photos_category"`);
    await queryRunner.query(`DROP INDEX "public"."idx_photos_album"`);
    await queryRunner.query(`DROP INDEX "public"."uq_photos_slug"`);
    await queryRunner.query(`DROP TABLE "photos"`);
    await queryRunner.query(`DROP TYPE "public"."photos_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_comments_photo"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TYPE "public"."comments_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookmarks_user"`);
    await queryRunner.query(`DROP TABLE "bookmarks"`);
    await queryRunner.query(`DROP INDEX "public"."idx_likes_photo"`);
    await queryRunner.query(`DROP TABLE "likes"`);
    await queryRunner.query(`DROP INDEX "public"."uq_collections_slug"`);
    await queryRunner.query(`DROP TABLE "collections"`);
    await queryRunner.query(`DROP TYPE "public"."collections_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_albums_photographer"`);
    await queryRunner.query(`DROP INDEX "public"."uq_albums_slug"`);
    await queryRunner.query(`DROP TABLE "albums"`);
    await queryRunner.query(`DROP TYPE "public"."albums_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_categories_slug"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
