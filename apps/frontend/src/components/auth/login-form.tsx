'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { App, Button, Divider, Form, Input } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '@/components/providers/auth-provider';
import { client, ApiError } from '@/lib/api-client';
import { siteConfig } from '@/lib/config';
import { AuthShell } from './auth-shell';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const redirectTo = params.get('redirect') || '/dashboard';

  useEffect(() => {
    client
      .providers()
      .then((p) => setGoogleEnabled(p.google))
      .catch(() => undefined);
  }, []);

  const onFinish = async (values: { email: string; password: string }) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      message.success('Welcome back');
      router.push(redirectTo);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back to Aperture."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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
          rules={[{ required: true, message: 'Enter your password' }]}
        >
          <Input.Password size="large" autoComplete="current-password" placeholder="••••••••" />
        </Form.Item>
        <div className="mb-4 text-right">
          <Link href="/forgot-password" className="text-sm text-primary">
            Forgot password?
          </Link>
        </div>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          Sign in
        </Button>
      </Form>

      {googleEnabled && (
        <>
          <Divider plain className="!text-ink-muted">
            or
          </Divider>
          <Button
            size="large"
            block
            icon={<GoogleOutlined />}
            href={`${siteConfig.apiUrl}/auth/google`}
          >
            Continue with Google
          </Button>
        </>
      )}
    </AuthShell>
  );
}
