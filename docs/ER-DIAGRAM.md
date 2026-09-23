# Entity-Relationship Diagram

Full schema across all phases (Mermaid `erDiagram` — renders on GitHub). Every table
extends `BaseEntity` (`id` uuid PK, `created_at`, `updated_at`, `deleted_at`, `version`).
Money is integer minor units (cents). `photographer_id` snapshots make the model
multi-photographer / revenue-split ready.

```mermaid
erDiagram
  users ||--o{ photos : "shoots"
  users ||--o{ albums : "owns"
  users ||--o{ refresh_tokens : "sessions"
  users ||--o{ likes : ""
  users ||--o{ bookmarks : ""
  users ||--o{ comments : "authors"
  users ||--o{ follows : "follower"
  users ||--o{ follows : "following"
  users ||--o{ orders : "places"
  users ||--o{ entitlements : "owns"
  users ||--o{ reviews : "writes"
  users ||--o{ wishlist_items : ""
  users ||--o{ notifications : "receives"
  users ||--o{ reports : "files"
  users ||--o{ subscriptions : "subscribes"
  users ||--o| photographer_profiles : "has"
  users ||--o{ photographer_applications : "applies"
  users ||--o{ payouts : "withdraws"

  categories ||--o{ photos : "classifies"
  albums ||--o{ photos : "groups"
  albums ||--o{ album_pricing : "priced by"
  albums ||--o{ album_assets : "delivers"
  albums ||--o{ reviews : "reviewed"
  albums ||--o{ wishlist_items : ""
  collections }o--o{ photos : "collection_photos"

  photos ||--o{ likes : ""
  photos ||--o{ bookmarks : ""
  photos ||--o{ comments : ""
  photos }o--o{ tags : "photo_tags"
  comments ||--o{ comments : "replies (parent_id)"

  carts ||--o{ cart_items : ""
  coupons ||--o{ carts : "applied"
  album_pricing ||--o{ cart_items : "tier"

  orders ||--o{ order_items : ""
  orders ||--o{ entitlements : "grants"
  order_items }o--|| albums : "snapshot"
  entitlements ||--o{ downloads : "audited by"
  album_assets ||--o{ downloads : ""

  subscription_plans ||--o{ subscriptions : ""

  users {
    uuid id PK
    citext email UK
    enum role "admin|photographer|user"
    int followers_count
    int following_count
  }
  photos {
    uuid id PK
    uuid photographer_id FK
    uuid category_id FK
    uuid album_id FK
    enum status
    int likes_count
    int views_count
    int shares_count
    varchar location_name
    jsonb exif_raw
  }
  albums {
    uuid id PK
    uuid photographer_id FK
    bool is_for_sale
    bool is_featured
    int discount_percent
    numeric rating_average
    int sales_count
  }
  album_pricing {
    uuid id PK
    uuid album_id FK
    enum license_type
    int price_cents
    int download_limit
    bool includes_raw
  }
  album_assets {
    uuid id PK
    uuid album_id FK
    enum type "high_res|zip|exclusive|raw"
    text storage_key "PRIVATE"
    bool requires_raw
  }
  orders {
    uuid id PK
    uuid user_id FK
    varchar invoice_number UK
    enum status
    int total_cents
    varchar stripe_payment_intent_id
  }
  order_items {
    uuid id PK
    uuid order_id FK
    uuid album_id FK
    uuid photographer_id "revenue split"
    int unit_price_cents
    int download_limit
  }
  entitlements {
    uuid id PK
    uuid user_id FK
    uuid album_id FK
    uuid order_id FK
    int download_limit
    int downloads_used
    timestamptz expires_at
    bool is_active
  }
  downloads {
    uuid id PK
    uuid entitlement_id FK
    uuid asset_id FK
    varchar ip_address
    varchar device_fingerprint
    bool watermarked
  }
  subscriptions {
    uuid id PK
    uuid user_id FK
    uuid plan_id FK
    enum status
    varchar stripe_subscription_id
    timestamptz current_period_end
  }
  photographer_profiles {
    uuid id PK
    uuid user_id FK UK
    enum verification_status
    numeric commission_rate "platform cut 0..1"
    bigint paid_out_cents
  }
  payouts {
    uuid id PK
    uuid photographer_id FK
    int amount_cents
    enum status
    enum method
  }
  follows {
    uuid id PK
    uuid follower_id FK
    uuid following_id FK
  }
  reports {
    uuid id PK
    uuid reporter_id FK
    enum target_type
    uuid target_id
    enum reason
    enum status
  }
  analytics_events {
    uuid id PK
    enum type
    varchar visitor_id
    uuid user_id
    varchar query
  }
  audit_logs {
    uuid id PK
    uuid actor_id
    varchar action
    varchar ip_address
    int status_code
  }
  platform_settings { uuid id PK varchar key UK jsonb value bool is_public }
  feature_flags { uuid id PK varchar key UK bool enabled int rollout_percentage }
  cms_pages { uuid id PK varchar slug UK enum status }
  coupons { uuid id PK varchar code UK enum type int value }
```

## Table inventory (by phase)

- **Phase 1 (core):** `users`, `refresh_tokens`, `photos`, `categories`, `albums`, `collections`, `collection_photos`, `likes`, `bookmarks`, `comments`
- **Phase 3 (marketplace):** `album_pricing`, `album_assets`, `reviews`, `wishlist_items`, `coupons`, `carts`, `cart_items`, `orders`, `order_items`, `entitlements`, `downloads`, `notifications`
- **Phase 4 (community):** `follows`, `reports`, `tags`, `photo_tags`, `analytics_events`, `share_events`, `audit_logs`
- **Phase 5 (scale):** `subscription_plans`, `subscriptions`, `photographer_applications`, `photographer_profiles`, `payouts`, `platform_settings`, `feature_flags`, `email_templates`, `cms_pages`

> Regenerate a precise diagram from the live DB with `npx @mermaid-js/... ` or `typeorm-uml` / SchemaSpy against the connection in `.env`.
