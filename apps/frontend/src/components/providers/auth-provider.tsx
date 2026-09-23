'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PublicUser } from '@photography/types';
import { client } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!authStorage.getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      setUser(await client.me());
    } catch {
      setUser(null);
    }
  }, []);

  // Hydrate session on mount.
  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await client.login(email, password);
    authStorage.setTokens(result.tokens);
    setUser(result.user);
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (body) => {
    const result = await client.register(body);
    authStorage.setTokens(result.tokens);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      await client.logout(refreshToken).catch(() => undefined);
    }
    authStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isAuthenticated: !!user, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
