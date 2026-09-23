import type { AuthTokens } from '@photography/types';

/**
 * Browser token storage. Phase 2 uses localStorage with body-transported refresh
 * tokens (matches the Phase 1 API). The roadmap calls for migrating refresh tokens
 * to an httpOnly cookie; this module is the single place that would change.
 */
const ACCESS_KEY = 'ap_access_token';
const REFRESH_KEY = 'ap_refresh_token';

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  setTokens(tokens: Pick<AuthTokens, 'accessToken' | 'refreshToken'>): void {
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear(): void {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
