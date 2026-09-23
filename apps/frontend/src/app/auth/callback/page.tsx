import { Suspense } from 'react';
import { OAuthCallback } from '@/components/auth/oauth-callback';

export const metadata = { robots: { index: false } };

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallback />
    </Suspense>
  );
}
