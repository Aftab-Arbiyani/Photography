import type {
  AssetType,
  CouponType,
  LicenseType,
  NotificationType,
  OrderStatus,
  ReviewStatus,
} from './commerce-enums.js';

/** A purchasable license tier for an album. Money is always integer minor units (cents). */
export interface PublicAlbumPricing {
  id: string;
  albumId: string;
  name: string;
  licenseType: LicenseType;
  priceCents: number;
  currency: string;
  downloadLimit: number;
  includesRaw: boolean;
  isDefault: boolean;
  /** price after album-level discount, computed at read time */
  effectivePriceCents: number;
}

/** A digital deliverable (gated behind purchase). Never exposes the storage key. */
export interface PublicAlbumAsset {
  id: string;
  albumId: string;
  type: AssetType;
  fileName: string;
  sizeBytes: number;
  contentType: string;
  requiresRaw: boolean;
}

/** Marketplace-facing album shape (extends the catalog album with commerce fields). */
export interface MarketplaceAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverPhotoId: string | null;
  photographerId: string;
  photosCount: number;
  isForSale: boolean;
  isFeatured: boolean;
  trailerUrl: string | null;
  discountPercent: number;
  discountActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  salesCount: number;
  pricing: PublicAlbumPricing[];
  /** lowest effective price across tiers, for listing cards */
  fromPriceCents: number | null;
  currency: string;
  /** present only when the request is authenticated */
  wishlisted?: boolean;
  purchased?: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface PublicReview {
  id: string;
  albumId: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface CartLineItem {
  id: string;
  albumId: string;
  albumTitle: string;
  albumSlug: string;
  coverPhotoId: string | null;
  pricingId: string;
  pricingName: string;
  licenseType: LicenseType;
  unitPriceCents: number;
  currency: string;
}

export interface CartTotals {
  subtotalCents: number;
  discountCents: number;
  couponCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  couponCode: string | null;
}

export interface PublicCart {
  id: string;
  items: CartLineItem[];
  totals: CartTotals;
}

export interface PublicCoupon {
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents: number;
}

export interface PublicOrderItem {
  id: string;
  albumId: string;
  albumTitle: string;
  pricingName: string;
  licenseType: LicenseType;
  unitPriceCents: number;
}

export interface PublicOrder {
  id: string;
  invoiceNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  couponCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  couponCode: string | null;
  items: PublicOrderItem[];
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface CheckoutIntent {
  orderId: string;
  clientSecret: string;
  publishableKey: string;
  amountCents: number;
  currency: string;
}

export interface PublicEntitlement {
  id: string;
  albumId: string;
  albumTitle: string;
  albumSlug: string;
  licenseType: LicenseType;
  downloadLimit: number;
  downloadsUsed: number;
  downloadsRemaining: number;
  includesRaw: boolean;
  expiresAt: string | null;
  isActive: boolean;
  assets: PublicAlbumAsset[];
  createdAt: string;
}

export interface SignedDownload {
  url: string;
  fileName: string;
  expiresAt: string;
  downloadsRemaining: number;
}

export interface PublicNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}
