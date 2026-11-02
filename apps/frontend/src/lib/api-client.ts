'use client';

import type {
  AnalyticsDashboard,
  ApiResponse,
  AuthResult,
  AuthTokens,
  CheckoutIntent,
  CursorPaginated,
  GlobalSearchResult,
  MarketplaceAlbum,
  MembershipState,
  Paginated,
  PublicAlbum,
  PublicAlbumAsset,
  PublicAlbumPricing,
  PublicCart,
  PublicCategory,
  PublicCmsPage,
  PublicCollection,
  PublicPlan,
  PublicSubscription,
  PublicReview,
  PhotographerDashboard,
  PublicComment,
  PublicNotification,
  PublicOrder,
  PublicEntitlement,
  PublicPayout,
  PublicPhoto,
  PublicPhotographer,
  PublicPhotographerApplication,
  PublicPhotographerProfile,
  PublicReport,
  PublicTag,
  PublicUser,
  ReportReason,
  ReportTargetType,
  SearchFacets,
  SearchHit,
  ShareChannel,
  ShareResult,
  ShareTargetType,
  SignedDownload,
  TrendingResult,
} from '@photography/types';
import { siteConfig } from './config';
import { authStorage } from './auth-storage';
import type {
  AdminAuditLog,
  AdminCmsPage,
  AdminCoupon,
  AdminEmailTemplate,
  AdminFeatureFlag,
  AdminSetting,
} from './admin-types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  /** internal — prevents infinite refresh recursion */
  _retried?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Attempt a single refresh, de-duplicated across concurrent 401s. */
async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return false;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${siteConfig.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        authStorage.clear();
        return false;
      }
      const json = (await res.json()) as ApiResponse<AuthTokens>;
      authStorage.setTokens(json.data);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Client-side fetch wrapper: injects the bearer token, unwraps the envelope, auto-refreshes on 401. */
export async function clientRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, _retried = false } = options;
  const token = auth ? authStorage.getAccessToken() : null;

  const res = await fetch(`${siteConfig.apiUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return clientRequest<T>(path, { ...options, _retried: true });
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as
    | ApiResponse<T>
    | { message?: string | string[] }
    | null;

  if (!res.ok || !json || !('success' in json) || !json.success) {
    const raw = json && 'message' in json ? json.message : undefined;
    const message = Array.isArray(raw) ? raw.join(', ') : (raw ?? `Request failed (${res.status})`);
    throw new ApiError(res.status, message as string);
  }
  return json.data;
}

/**
 * Multipart upload wrapper (FormData) — same bearer + auto-refresh + envelope
 * handling as clientRequest, but lets the browser set the multipart boundary.
 */
export async function clientUpload<T>(
  path: string,
  formData: FormData,
  _retried = false,
): Promise<T> {
  const token = authStorage.getAccessToken();
  const res = await fetch(`${siteConfig.apiUrl}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return clientUpload<T>(path, formData, true);
  }

  const json = (await res.json().catch(() => null)) as
    | ApiResponse<T>
    | { message?: string | string[] }
    | null;
  if (!res.ok || !json || !('success' in json) || !json.success) {
    const raw = json && 'message' in json ? json.message : undefined;
    const message = Array.isArray(raw) ? raw.join(', ') : (raw ?? `Upload failed (${res.status})`);
    throw new ApiError(res.status, message as string);
  }
  return json.data;
}

/** Typed client surface used by client components. */
export const client = {
  // auth
  login: (email: string, password: string) =>
    clientRequest<AuthResult>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (body: { email: string; password: string; firstName?: string; lastName?: string }) =>
    clientRequest<AuthResult>('/auth/register', { method: 'POST', body }),
  me: () => clientRequest<PublicUser>('/users/me', { auth: true }),
  logout: (refreshToken: string) =>
    clientRequest<void>('/auth/logout', { method: 'POST', auth: true, body: { refreshToken } }),
  forgotPassword: (email: string) =>
    clientRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  resetPassword: (token: string, newPassword: string) =>
    clientRequest<void>('/auth/reset-password', { method: 'POST', body: { token, newPassword } }),
  verifyEmail: (token: string) =>
    clientRequest<void>('/auth/verify-email', { method: 'POST', body: { token } }),
  providers: () => clientRequest<{ local: boolean; google: boolean }>('/auth/providers'),

  // photos
  // Optional auth: anonymous callers get the same list, signed-in ones also get
  // their likedByMe / bookmarkedByMe flags.
  gallery: (qs: string) =>
    clientRequest<CursorPaginated<PublicPhoto>>(`/photos${qs}`, { auth: true }),
  photo: (slug: string) => clientRequest<PublicPhoto>(`/photos/${slug}`, { auth: true }),
  like: (id: string) =>
    clientRequest<{ liked: boolean; likesCount: number }>(`/photos/${id}/like`, {
      method: 'POST',
      auth: true,
    }),
  unlike: (id: string) =>
    clientRequest<{ liked: boolean; likesCount: number }>(`/photos/${id}/like`, {
      method: 'DELETE',
      auth: true,
    }),
  bookmark: (id: string) =>
    clientRequest<{ bookmarked: boolean }>(`/photos/${id}/bookmark`, {
      method: 'POST',
      auth: true,
    }),
  unbookmark: (id: string) =>
    clientRequest<{ bookmarked: boolean }>(`/photos/${id}/bookmark`, {
      method: 'DELETE',
      auth: true,
    }),
  listComments: (photoId: string, page = 1) =>
    clientRequest<Paginated<PublicComment>>(`/photos/${photoId}/comments?page=${page}&limit=20`),
  addComment: (photoId: string, bodyText: string, parentId?: string) =>
    clientRequest<PublicComment>(`/photos/${photoId}/comments`, {
      method: 'POST',
      auth: true,
      body: { body: bodyText, parentId },
    }),

  // ---- dashboard: profile ----
  updateProfile: (body: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => clientRequest<PublicUser>('/users/me', { method: 'PATCH', auth: true, body }),
  changePassword: (currentPassword: string, newPassword: string) =>
    clientRequest<void>('/auth/change-password', {
      method: 'POST',
      auth: true,
      body: { currentPassword, newPassword },
    }),

  // ---- dashboard: uploads (photographer/admin) ----
  categories: () => clientRequest<PublicCategory[]>('/categories'),
  uploadPhoto: (formData: FormData) => clientUpload<PublicPhoto>('/photos', formData),

  // ---- dashboard: engagement ----
  myBookmarks: (page = 1) =>
    clientRequest<Paginated<PublicPhoto>>(`/photos/me/bookmarks?page=${page}&limit=24`, {
      auth: true,
    }),
  myWishlist: () => clientRequest<MarketplaceAlbum[]>('/wishlist', { auth: true }),

  // ---- dashboard: orders + downloads ----
  myOrders: (page = 1) =>
    clientRequest<Paginated<PublicOrder>>(`/orders?page=${page}&limit=20`, { auth: true }),
  getOrder: (id: string) => clientRequest<PublicOrder>(`/orders/${id}`, { auth: true }),
  /** Fetch the order's PDF invoice (binary) with the bearer token, as a Blob. */
  invoicePdf: async (id: string): Promise<Blob> => {
    const token = authStorage.getAccessToken();
    const res = await fetch(`${siteConfig.apiUrl}/orders/${id}/invoice.pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, `Could not load invoice (${res.status})`);
    return res.blob();
  },
  downloadsLibrary: () => clientRequest<PublicEntitlement[]>('/downloads/library', { auth: true }),
  requestDownload: (assetId: string) =>
    clientRequest<SignedDownload>(`/downloads/assets/${assetId}`, {
      method: 'POST',
      auth: true,
      body: {},
    }),

  // ---- dashboard: notifications ----
  notifications: (page = 1) =>
    clientRequest<Paginated<PublicNotification>>(`/notifications?page=${page}&limit=20`, {
      auth: true,
    }),
  unreadCount: () =>
    clientRequest<{ count: number }>('/notifications/unread-count', { auth: true }),
  markAllRead: () => clientRequest<void>('/notifications/read-all', { method: 'POST', auth: true }),
  markNotificationRead: (id: string) =>
    clientRequest<void>(`/notifications/${id}/read`, { method: 'POST', auth: true }),

  // ---- dashboard: photographer ----
  myApplication: () =>
    clientRequest<PublicPhotographerApplication | null>('/photographers/me/application', {
      auth: true,
    }),
  applyPhotographer: (statement: string, portfolioUrl?: string) =>
    clientRequest<PublicPhotographerApplication>('/photographers/apply', {
      method: 'POST',
      auth: true,
      body: { statement, portfolioUrl },
    }),
  photographerDashboard: () =>
    clientRequest<PhotographerDashboard>('/revenue/me/dashboard', { auth: true }),

  // ---- marketplace (storefront) ----
  marketplaceAlbums: (qs = '') =>
    clientRequest<Paginated<MarketplaceAlbum>>(`/marketplace/albums${qs}`),
  marketplaceFeatured: () => clientRequest<MarketplaceAlbum[]>('/marketplace/albums/featured'),
  marketplaceAlbum: (slug: string) =>
    clientRequest<MarketplaceAlbum>(`/marketplace/albums/${slug}`, { auth: true }),
  marketplaceRelated: (slug: string) =>
    clientRequest<MarketplaceAlbum[]>(`/marketplace/albums/${slug}/related`),
  albumReviews: (albumId: string, page = 1) =>
    clientRequest<Paginated<PublicReview>>(`/albums/${albumId}/reviews?page=${page}&limit=20`),
  upsertReview: (albumId: string, rating: number, title?: string, body?: string) =>
    clientRequest<PublicReview>(`/albums/${albumId}/reviews`, {
      method: 'PUT',
      auth: true,
      body: { rating, title, body },
    }),

  // wishlist toggle (albums)
  addWishlist: (albumId: string) =>
    clientRequest<{ wishlisted: true }>(`/wishlist/${albumId}`, { method: 'POST', auth: true }),
  removeWishlist: (albumId: string) =>
    clientRequest<{ wishlisted: false }>(`/wishlist/${albumId}`, { method: 'DELETE', auth: true }),

  // ---- cart ----
  cart: () => clientRequest<PublicCart>('/cart', { auth: true }),
  cartAdd: (albumId: string, pricingId: string) =>
    clientRequest<PublicCart>('/cart/items', {
      method: 'POST',
      auth: true,
      body: { albumId, pricingId },
    }),
  cartRemove: (albumId: string) =>
    clientRequest<PublicCart>(`/cart/items/${albumId}`, { method: 'DELETE', auth: true }),
  cartClear: () => clientRequest<void>('/cart', { method: 'DELETE', auth: true }),
  cartApplyCoupon: (code: string) =>
    clientRequest<PublicCart>('/cart/coupon', { method: 'POST', auth: true, body: { code } }),
  cartRemoveCoupon: () =>
    clientRequest<PublicCart>('/cart/coupon', { method: 'DELETE', auth: true }),

  // ---- checkout ----
  checkout: () =>
    clientRequest<CheckoutIntent>('/payments/checkout', { method: 'POST', auth: true, body: {} }),

  // ---- community: search + discovery ----
  search: (q: string) =>
    clientRequest<GlobalSearchResult>(`/search?q=${encodeURIComponent(q)}`, { auth: true }),
  searchPhotos: (qs: string) =>
    clientRequest<Paginated<SearchHit>>(`/search/photos${qs}`, { auth: true }),
  searchFacets: () => clientRequest<SearchFacets>('/search/facets'),
  trendingPhotos: () => clientRequest<TrendingResult<SearchHit>>('/discovery/trending/photos'),
  popularAlbums: () => clientRequest<TrendingResult<SearchHit>>('/discovery/popular/albums'),
  featuredCollections: () =>
    clientRequest<TrendingResult<SearchHit>>('/discovery/featured/collections'),
  popularTags: () => clientRequest<PublicTag[]>('/tags/popular'),

  // ---- community: photographers (follow) ----
  photographer: (id: string) =>
    clientRequest<PublicPhotographer>(`/photographers/${id}`, { auth: true }),
  photographerFollowers: (id: string, page = 1) =>
    clientRequest<Paginated<PublicPhotographer>>(
      `/photographers/${id}/followers?page=${page}&limit=24`,
      { auth: true },
    ),
  photographerFollowing: (id: string, page = 1) =>
    clientRequest<Paginated<PublicPhotographer>>(
      `/photographers/${id}/following?page=${page}&limit=24`,
      { auth: true },
    ),
  follow: (id: string) =>
    clientRequest<{ following: true; followersCount: number }>(`/photographers/${id}/follow`, {
      method: 'POST',
      auth: true,
    }),
  unfollow: (id: string) =>
    clientRequest<{ following: false; followersCount: number }>(`/photographers/${id}/follow`, {
      method: 'DELETE',
      auth: true,
    }),

  // ---- community: report + share ----
  report: (
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    details?: string,
  ) =>
    clientRequest<PublicReport>('/reports', {
      method: 'POST',
      auth: true,
      body: { targetType, targetId, reason, details },
    }),
  share: (targetType: ShareTargetType, targetId: string, channel: ShareChannel) =>
    clientRequest<ShareResult>('/share', {
      method: 'POST',
      body: { targetType, targetId, channel },
    }),

  // ---- membership / subscriptions ----
  plans: () => clientRequest<PublicPlan[]>('/subscriptions/plans'),
  mySubscription: () =>
    clientRequest<{ subscription: PublicSubscription | null; membership: MembershipState }>(
      '/subscriptions/me',
      { auth: true },
    ),
  subscribe: (planCode: string) =>
    clientRequest<{ checkoutUrl: string | null; activated: boolean }>('/subscriptions/checkout', {
      method: 'POST',
      auth: true,
      body: { planCode },
    }),
  cancelSubscription: () =>
    clientRequest<{ cancelAtPeriodEnd: boolean }>('/subscriptions/cancel', {
      method: 'POST',
      auth: true,
    }),

  // ---- public CMS pages ----
  cmsPage: (slug: string) => clientRequest<PublicCmsPage>(`/pages/${slug}`),

  // ---- recently viewed (marketplace) ----
  recentlyViewed: () =>
    clientRequest<MarketplaceAlbum[]>('/marketplace/recently-viewed', { auth: true }),

  // ---- analytics (anonymous client event capture) ----
  trackEvent: (body: {
    type: string;
    visitorId?: string;
    path?: string;
    query?: string;
    referrer?: string;
  }) => clientRequest<void>('/analytics/events', { method: 'POST', body }),

  // ---- comments (delete own) ----
  deleteComment: (id: string) =>
    clientRequest<void>(`/photos/comments/${id}`, { method: 'DELETE', auth: true }),

  // ---- studio: photographer content management ----
  studio: {
    profile: () =>
      clientRequest<PublicPhotographerProfile>('/photographers/me/profile', { auth: true }),
    updateProfile: (body: Record<string, unknown>) =>
      clientRequest<PublicPhotographerProfile>('/photographers/me/profile', {
        method: 'PATCH',
        auth: true,
        body,
      }),

    // photos owned by the current photographer (gallery filtered by photographerId)
    myPhotos: (photographerId: string, cursor?: string) => {
      const p = new URLSearchParams({ photographerId, limit: '24' });
      if (cursor) p.set('cursor', cursor);
      return clientRequest<CursorPaginated<PublicPhoto>>(`/photos?${p.toString()}`);
    },
    updatePhoto: (id: string, body: Record<string, unknown>) =>
      clientRequest<PublicPhoto>(`/photos/${id}`, { method: 'PATCH', auth: true, body }),
    deletePhoto: (id: string) =>
      clientRequest<void>(`/photos/${id}`, { method: 'DELETE', auth: true }),

    // albums
    albums: (page = 1) => clientRequest<Paginated<PublicAlbum>>(`/albums?page=${page}&limit=50`),
    createAlbum: (body: Record<string, unknown>) =>
      clientRequest<PublicAlbum>('/albums', { method: 'POST', auth: true, body }),
    updateAlbum: (id: string, body: Record<string, unknown>) =>
      clientRequest<PublicAlbum>(`/albums/${id}`, { method: 'PATCH', auth: true, body }),
    deleteAlbum: (id: string) =>
      clientRequest<void>(`/albums/${id}`, { method: 'DELETE', auth: true }),

    // sale settings (for-sale / featured / discount / trailer)
    updateAlbumSettings: (id: string, body: Record<string, unknown>) =>
      clientRequest<MarketplaceAlbum>(`/marketplace/albums/${id}/settings`, {
        method: 'PATCH',
        auth: true,
        body,
      }),

    // pricing tiers
    addPricing: (albumId: string, body: Record<string, unknown>) =>
      clientRequest<PublicAlbumPricing>(`/marketplace/albums/${albumId}/pricing`, {
        method: 'POST',
        auth: true,
        body,
      }),
    updatePricing: (albumId: string, pricingId: string, body: Record<string, unknown>) =>
      clientRequest<PublicAlbumPricing>(`/marketplace/albums/${albumId}/pricing/${pricingId}`, {
        method: 'PATCH',
        auth: true,
        body,
      }),
    deletePricing: (albumId: string, pricingId: string) =>
      clientRequest<void>(`/marketplace/albums/${albumId}/pricing/${pricingId}`, {
        method: 'DELETE',
        auth: true,
      }),

    // deliverable assets
    listAssets: (albumId: string) =>
      clientRequest<PublicAlbumAsset[]>(`/marketplace/albums/${albumId}/assets`, { auth: true }),
    signAssetUpload: (albumId: string, body: { fileName: string; contentType: string }) =>
      clientRequest<{ uploadUrl: string; storageKey: string; expiresInSeconds: number }>(
        `/marketplace/albums/${albumId}/assets/upload-url`,
        { method: 'POST', auth: true, body },
      ),
    registerAsset: (albumId: string, body: Record<string, unknown>) =>
      clientRequest<PublicAlbumAsset>(`/marketplace/albums/${albumId}/assets`, {
        method: 'POST',
        auth: true,
        body,
      }),
    deleteAsset: (albumId: string, assetId: string) =>
      clientRequest<void>(`/marketplace/albums/${albumId}/assets/${assetId}`, {
        method: 'DELETE',
        auth: true,
      }),
  },

  // ---- admin ----
  admin: {
    analytics: (from?: string, to?: string) => {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      const qs = p.toString();
      return clientRequest<AnalyticsDashboard>(`/analytics/dashboard${qs ? `?${qs}` : ''}`, {
        auth: true,
      });
    },
    orders: (page = 1) =>
      clientRequest<Paginated<PublicOrder>>(`/orders/admin?page=${page}&limit=20`, { auth: true }),
    refund: (orderId: string, amountCents?: number) =>
      clientRequest<{ refundedCents: number; full: boolean }>(`/payments/refund/${orderId}`, {
        method: 'POST',
        auth: true,
        body: amountCents ? { amountCents } : {},
      }),
    users: (page = 1, search?: string) => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) p.set('search', search);
      return clientRequest<Paginated<PublicUser>>(`/users?${p.toString()}`, { auth: true });
    },
    updateUser: (id: string, body: { role?: string; isEmailVerified?: boolean }) =>
      clientRequest<PublicUser>(`/users/${id}`, { method: 'PATCH', auth: true, body }),
    applications: (status?: string, page = 1) => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) p.set('status', status);
      return clientRequest<Paginated<PublicPhotographerApplication>>(
        `/photographers/admin/applications?${p.toString()}`,
        { auth: true },
      );
    },
    reviewApplication: (id: string, status: string, reviewNote?: string) =>
      clientRequest<PublicPhotographerApplication>(
        `/photographers/admin/applications/${id}/review`,
        {
          method: 'PATCH',
          auth: true,
          body: { status, reviewNote },
        },
      ),
    verifyPhotographer: (userId: string, status: string) =>
      clientRequest<unknown>(`/photographers/admin/${userId}/verify`, {
        method: 'PATCH',
        auth: true,
        body: { status },
      }),
    setCommission: (userId: string, commissionRate: number) =>
      clientRequest<PublicPhotographerProfile>(`/photographers/admin/${userId}/commission`, {
        method: 'PATCH',
        auth: true,
        body: { commissionRate },
      }),
    photographerProfile: (userId: string) =>
      clientRequest<PublicPhotographerProfile>(`/photographers/${userId}/profile`, { auth: true }),
    payouts: (status?: string, page = 1) => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) p.set('status', status);
      return clientRequest<Paginated<PublicPayout>>(`/revenue/admin/payouts?${p.toString()}`, {
        auth: true,
      });
    },
    processPayout: (id: string, status: string, reference?: string, failureReason?: string) =>
      clientRequest<PublicPayout>(`/revenue/admin/payouts/${id}`, {
        method: 'PATCH',
        auth: true,
        body: { status, reference, failureReason },
      }),
    revenueSummary: () =>
      clientRequest<{
        grossCents: number;
        commissionCents: number;
        payoutsPaidCents: number;
        currency: string;
      }>('/revenue/admin/summary', { auth: true }),
    reports: (status?: string, page = 1) => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) p.set('status', status);
      return clientRequest<Paginated<PublicReport>>(`/reports?${p.toString()}`, { auth: true });
    },
    resolveReport: (id: string, status: string, resolutionNote?: string) =>
      clientRequest<PublicReport>(`/reports/${id}/resolve`, {
        method: 'PATCH',
        auth: true,
        body: { status, resolutionNote },
      }),
    coupons: () => clientRequest<AdminCoupon[]>('/coupons', { auth: true }),
    createCoupon: (body: Record<string, unknown>) =>
      clientRequest<AdminCoupon>('/coupons', { method: 'POST', auth: true, body }),
    deleteCoupon: (id: string) =>
      clientRequest<void>(`/coupons/${id}`, { method: 'DELETE', auth: true }),
    settings: () => clientRequest<AdminSetting[]>('/admin/platform/settings', { auth: true }),
    setSetting: (body: Record<string, unknown>) =>
      clientRequest<AdminSetting>('/admin/platform/settings', { method: 'POST', auth: true, body }),
    deleteSetting: (key: string) =>
      clientRequest<void>(`/admin/platform/settings/${key}`, { method: 'DELETE', auth: true }),
    emailTemplates: () =>
      clientRequest<AdminEmailTemplate[]>('/admin/platform/email-templates', { auth: true }),
    setEmailTemplate: (body: Record<string, unknown>) =>
      clientRequest<AdminEmailTemplate>('/admin/platform/email-templates', {
        method: 'POST',
        auth: true,
        body,
      }),
    // taxonomy CRUD (categories + collections)
    createCategory: (body: Record<string, unknown>) =>
      clientRequest<PublicCategory>('/categories', { method: 'POST', auth: true, body }),
    updateCategory: (id: string, body: Record<string, unknown>) =>
      clientRequest<PublicCategory>(`/categories/${id}`, { method: 'PATCH', auth: true, body }),
    deleteCategory: (id: string) =>
      clientRequest<void>(`/categories/${id}`, { method: 'DELETE', auth: true }),
    collections: () => clientRequest<PublicCollection[]>('/collections', { auth: true }),
    createCollection: (body: Record<string, unknown>) =>
      clientRequest<PublicCollection>('/collections', { method: 'POST', auth: true, body }),
    updateCollection: (id: string, body: Record<string, unknown>) =>
      clientRequest<PublicCollection>(`/collections/${id}`, { method: 'PATCH', auth: true, body }),
    deleteCollection: (id: string) =>
      clientRequest<void>(`/collections/${id}`, { method: 'DELETE', auth: true }),
    featureFlags: () =>
      clientRequest<AdminFeatureFlag[]>('/admin/platform/feature-flags', { auth: true }),
    setFeatureFlag: (body: Record<string, unknown>) =>
      clientRequest<AdminFeatureFlag>('/admin/platform/feature-flags', {
        method: 'POST',
        auth: true,
        body,
      }),
    cmsPages: () => clientRequest<AdminCmsPage[]>('/admin/platform/pages', { auth: true }),
    createCmsPage: (body: Record<string, unknown>) =>
      clientRequest<AdminCmsPage>('/admin/platform/pages', { method: 'POST', auth: true, body }),
    updateCmsPage: (id: string, body: Record<string, unknown>) =>
      clientRequest<AdminCmsPage>(`/admin/platform/pages/${id}`, {
        method: 'PATCH',
        auth: true,
        body,
      }),
    deleteCmsPage: (id: string) =>
      clientRequest<void>(`/admin/platform/pages/${id}`, { method: 'DELETE', auth: true }),
    auditLogs: (page = 1) =>
      clientRequest<Paginated<AdminAuditLog>>(`/audit-logs?page=${page}&limit=30`, { auth: true }),
  },
};
