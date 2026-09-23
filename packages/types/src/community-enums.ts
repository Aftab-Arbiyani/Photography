/** Community / social domain enums. Persisted + serialized — keep values stable. */

/** What a report targets. */
export enum ReportTargetType {
  PHOTO = 'photo',
  ALBUM = 'album',
  COLLECTION = 'collection',
  COMMENT = 'comment',
  USER = 'user',
}

export enum ReportReason {
  SPAM = 'spam',
  ABUSE = 'abuse',
  COPYRIGHT = 'copyright',
  NUDITY = 'nudity',
  HATE = 'hate',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

/** Channel a share was performed through (best-effort, client-reported). */
export enum ShareChannel {
  LINK = 'link',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  PINTEREST = 'pinterest',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
}

export enum ShareTargetType {
  PHOTO = 'photo',
  ALBUM = 'album',
  COLLECTION = 'collection',
}

export enum AnalyticsEventType {
  PAGEVIEW = 'pageview',
  SEARCH = 'search',
  PHOTO_VIEW = 'photo_view',
  ALBUM_VIEW = 'album_view',
  ADD_TO_CART = 'add_to_cart',
  CHECKOUT = 'checkout',
}

/** Entity kinds searchable by the global search. */
export enum SearchEntityType {
  PHOTO = 'photo',
  ALBUM = 'album',
  COLLECTION = 'collection',
  CATEGORY = 'category',
  TAG = 'tag',
}
