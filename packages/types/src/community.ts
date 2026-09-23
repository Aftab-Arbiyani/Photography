import type {
  AnalyticsEventType,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  SearchEntityType,
  ShareChannel,
  ShareTargetType,
} from './community-enums.js';

export interface PublicPhotographer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  photosCount: number;
  /** present only when the request is authenticated */
  isFollowing?: boolean;
}

export interface PublicTag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

export interface PublicReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reporterId: string;
  resolutionNote: string | null;
  createdAt: string;
}

export interface ShareResult {
  targetType: ShareTargetType;
  targetId: string;
  channel: ShareChannel;
  shareUrl: string;
  sharesCount: number;
}

/** A unit of any entity in a global-search response. */
export interface SearchHit {
  type: SearchEntityType;
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  imageId: string | null;
  /** Resolved thumbnail URL (photo hits); null when not applicable. */
  imageUrl?: string | null;
  score?: number;
}

export interface GlobalSearchResult {
  query: string;
  total: number;
  groups: Record<SearchEntityType, SearchHit[]>;
}

export interface SearchFacets {
  cameras: Array<{ value: string; count: number }>;
  lenses: Array<{ value: string; count: number }>;
  tags: Array<{ value: string; count: number }>;
  categories: Array<{ value: string; slug: string; count: number }>;
}

export interface TrendingResult<T> {
  items: T[];
  generatedAt: string;
}

// ---- analytics dashboard ----

export interface TimeseriesPoint {
  date: string;
  value: number;
}

export interface TopItem {
  id: string;
  label: string;
  value: number;
}

export interface AnalyticsDashboard {
  range: { from: string; to: string };
  visitors: number;
  returningUsers: number;
  pageviews: number;
  sales: { count: number; revenueCents: number; currency: string };
  downloads: number;
  conversionRate: number; // orders / visitors
  popularPhotos: TopItem[];
  popularAlbums: TopItem[];
  topSearches: TopItem[];
  revenueGraph: TimeseriesPoint[];
  visitorsGraph: TimeseriesPoint[];
}

export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  path?: string;
  query?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}
