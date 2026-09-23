'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { App, Button, Form, Input } from 'antd';
import { useAuth } from '@/components/providers/auth-provider';
import { ApiError } from '@/lib/api-client';
import { AuthShell } from './auth-shell';

interface RegisterValues {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: RegisterValues) => {
    setSubmitting(true);
    try {
      await register(values);
      message.success('Account created — check your email to verify.');
      router.push('/dashboard');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Aperture in a few seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <div className="flex gap-3">
          <Form.Item name="firstName" label="First name" className="flex-1">
            <Input size="large" autoComplete="given-name" />
          </Form.Item>
          <Form.Item name="lastName" label="Last name" className="flex-1">
            <Input size="large" autoComplete="family-name" />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
        >
          <Input size="large" autoComplete="email" placeholder="you@example.com" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, min: 8, message: 'At least 8 characters' },
            {
              pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: 'Include upper, lower case and a number',
            },
          ]}
        >
          <Input.Password size="large" autoComplete="new-password" placeholder="••••••••" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          Create account
        </Button>
      </Form>
    </AuthShell>
  );
}
