import type {
  ApplicationStatus,
  CmsPageStatus,
  PayoutMethod,
  PayoutStatus,
  SubscriptionInterval,
  SubscriptionStatus,
  VerificationStatus,
} from './platform-enums.js';

export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: SubscriptionInterval;
  features: string[];
  isActive: boolean;
}

export interface PublicSubscription {
  id: string;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isPremium: boolean;
}

export interface MembershipState {
  isPremium: boolean;
  planCode: string | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
}

export interface PublicPhotographerApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  statement: string | null;
  portfolioUrl: string | null;
  reviewNote: string | null;
  createdAt: string;
}

export interface PublicPhotographerProfile {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  commissionRate: number; // platform cut, 0..1
  createdAt: string;
}

export interface PhotographerEarnings {
  grossCents: number;
  commissionCents: number;
  netCents: number;
  paidOutCents: number;
  availableCents: number;
  pendingPayoutCents: number;
  salesCount: number;
  currency: string;
}

export interface PublicPayout {
  id: string;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  reference: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface PhotographerDashboard {
  profile: PublicPhotographerProfile;
  earnings: PhotographerEarnings;
  photosCount: number;
  albumsCount: number;
  followersCount: number;
  topPhotos: Array<{ id: string; title: string; views: number; sales: number }>;
}

export interface PublicCmsPage {
  slug: string;
  title: string;
  body: string;
  status: CmsPageStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
}

export interface PublicFeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

/** A URL entry for the dynamically-generated sitemap. */
export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
}
