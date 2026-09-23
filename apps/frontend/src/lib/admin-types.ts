import type { CmsPageStatus, CouponType } from '@photography/types';

/** Admin-facing entity shapes (include `id` + editable fields the admin UI needs). */

export interface AdminCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
}

export interface AdminFeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  rolloutPercentage: number;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  isPublic: boolean;
}

export interface AdminCmsPage {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: CmsPageStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
}

export interface AdminEmailTemplate {
  id: string;
  key: string;
  subject: string;
  htmlBody: string;
  variables: string[];
  isActive: boolean;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  statusCode: number | null;
  createdAt: string;
}
