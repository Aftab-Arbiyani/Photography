/**
 * Marketplace domain enums. Values are persisted and serialized — keep stable.
 */

export enum LicenseType {
  PERSONAL = 'personal',
  STANDARD = 'standard',
  EXTENDED = 'extended',
  EXCLUSIVE = 'exclusive',
}

/** Purchasable digital deliverables attached to an album. */
export enum AssetType {
  HIGH_RES = 'high_res',
  ZIP = 'zip',
  EXCLUSIVE = 'exclusive',
  RAW = 'raw',
}

export enum CouponType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  PURCHASE_SUCCESS = 'purchase_success',
  DOWNLOAD_READY = 'download_ready',
  ORDER_FAILED = 'order_failed',
  REFUND_PROCESSED = 'refund_processed',
  REVIEW_REPLY = 'review_reply',
  SYSTEM = 'system',
  // Phase 4 — community / social
  NEW_FOLLOWER = 'new_follower',
  NEW_COMMENT = 'new_comment',
  NEW_REPLY = 'new_reply',
  PHOTO_LIKED = 'photo_liked',
  REPORT_RECEIVED = 'report_received',
  REPORT_RESOLVED = 'report_resolved',
}

export enum ReviewStatus {
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
}
