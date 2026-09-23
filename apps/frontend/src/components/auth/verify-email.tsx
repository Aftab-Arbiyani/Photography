'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { client } from '@/lib/api-client';
import { AuthShell } from './auth-shell';

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<Status>('verifying');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setStatus('error');
      return;
    }
    client
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AuthShell
      title="Email verification"
      footer={
        <Link href="/login" className="text-primary">
          Go to sign in
        </Link>
      }
    >
      {status === 'verifying' && (
        <p className="flex items-center gap-3 text-sm text-ink-muted">
          <Spin size="small" /> Verifying your email…
        </p>
      )}
      {status === 'success' && (
        <p className="text-sm text-ink">Your email is verified. You can now sign in.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-ink-muted">This verification link is invalid or has expired.</p>
      )}
    </AuthShell>
  );
}
