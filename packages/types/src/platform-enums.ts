/** Phase 5 — membership, photographer onboarding, revenue & platform enums. */

export enum SubscriptionInterval {
  MONTH = 'month',
  YEAR = 'year',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
}

/** Photographer onboarding application lifecycle. */
export enum ApplicationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/** KYC / identity verification state for a photographer. */
export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum PayoutStatus {
  REQUESTED = 'requested',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum PayoutMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK = 'bank',
}

export enum CmsPageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}
