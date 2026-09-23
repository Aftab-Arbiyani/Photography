'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { authStorage } from '@/lib/auth-storage';
import { useAuth } from '@/components/providers/auth-provider';

/** Consumes the tokens appended to the Google OAuth redirect, then hydrates the session. */
export function OAuthCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      authStorage.setTokens({ accessToken, refreshToken });
      void refreshUser().finally(() => router.replace('/dashboard'));
    } else {
      router.replace('/login?error=oauth');
    }
  }, [params, refreshUser, router]);

  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center gap-4">
      <Spin size="large" />
      <p className="text-sm text-ink-muted">Signing you in…</p>
    </section>
  );
}
