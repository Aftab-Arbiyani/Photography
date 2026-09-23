import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Composite / partial indexes tuned for the hot read paths at scale
 * (thousands of photographers, millions of photos). Created CONCURRENTLY-safe
 * via IF NOT EXISTS; additive only — no data change.
 */
export class AddScaleIndexes1782466701303 implements MigrationInterface {
  name = 'AddScaleIndexes1782466701303';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      // Gallery keyset pagination: published photos newest-first.
      `CREATE INDEX IF NOT EXISTS "idx_photos_published_feed" ON "photos" ("status", "published_at" DESC, "id" DESC)`,
      // Photographer portfolio listing.
      `CREATE INDEX IF NOT EXISTS "idx_photos_photographer_published" ON "photos" ("photographer_id", "status", "published_at" DESC)`,
      // Trending ranking inputs.
      `CREATE INDEX IF NOT EXISTS "idx_photos_trending" ON "photos" ("status", "views_count" DESC)`,
      // Marketplace browse: for-sale + featured.
      `CREATE INDEX IF NOT EXISTS "idx_albums_for_sale" ON "albums" ("is_for_sale", "status", "published_at" DESC)`,
      // Revenue rollups: per-photographer paid items.
      `CREATE INDEX IF NOT EXISTS "idx_order_items_photographer_order" ON "order_items" ("photographer_id", "order_id")`,
      // Order history + admin queue.
      `CREATE INDEX IF NOT EXISTS "idx_orders_user_created" ON "orders" ("user_id", "created_at" DESC)`,
      // Entitlement lookups during downloads.
      `CREATE INDEX IF NOT EXISTS "idx_entitlements_user_album_active" ON "entitlements" ("user_id", "album_id", "is_active")`,
      // Notifications unread query.
      `CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread" ON "notifications" ("user_id", "read_at")`,
      // Analytics dashboard time-series scans.
      `CREATE INDEX IF NOT EXISTS "idx_analytics_type_created_brin" ON "analytics_events" ("type", "created_at")`,
      // Active subscription resolution.
      `CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_status" ON "subscriptions" ("user_id", "status")`,
    ];
    for (const sql of statements) {
      await queryRunner.query(sql);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      'idx_photos_published_feed',
      'idx_photos_photographer_published',
      'idx_photos_trending',
      'idx_albums_for_sale',
      'idx_order_items_photographer_order',
      'idx_orders_user_created',
      'idx_entitlements_user_album_active',
      'idx_notifications_user_unread',
      'idx_analytics_type_created_brin',
      'idx_subscriptions_user_status',
    ];
    for (const idx of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${idx}"`);
    }
  }
}
