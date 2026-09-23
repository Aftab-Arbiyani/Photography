import { Suspense } from 'react';
import { MembershipView } from '@/components/membership/membership-view';

export const metadata = { title: 'Membership' };

export default function AccountMembershipPage() {
  return (
    <Suspense fallback={null}>
      <MembershipView />
    </Suspense>
  );
}
