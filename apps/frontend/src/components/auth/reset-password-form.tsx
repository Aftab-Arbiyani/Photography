'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { App, Button, Form, Input } from 'antd';
import { ApiError, client } from '@/lib/api-client';
import { AuthShell } from './auth-shell';

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { message } = App.useApp();
  const token = params.get('token') ?? '';
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { newPassword: string }) => {
    if (!token) {
      message.error('Missing or invalid reset token.');
      return;
    }
    setSubmitting(true);
    try {
      await client.resetPassword(token, values.newPassword);
      message.success('Password reset. Please sign in.');
      router.push('/login');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      footer={
        <Link href="/login" className="text-primary">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <p className="text-sm text-ink-muted">This reset link is invalid or has expired.</p>
      ) : (
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="newPassword"
            label="New password"
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
            Reset password
          </Button>
        </Form>
      )}
    </AuthShell>
  );
}
