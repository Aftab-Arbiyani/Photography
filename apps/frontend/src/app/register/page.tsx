import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({ title: 'Create account', path: '/register' });

export default function RegisterPage() {
  return <RegisterForm />;
}
