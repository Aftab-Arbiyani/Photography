'use client';

import Link from 'next/link';
import { useState } from 'react';
import { App, Button, Form, Input } from 'antd';
import { client } from '@/lib/api-client';
import { AuthShell } from './auth-shell';

export function ForgotPasswordForm() {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setSubmitting(true);
    try {
      await client.forgotPassword(values.email);
      setSent(true);
    } catch {
      // The API never reveals account existence; show the same success state.
      setSent(true);
    } finally {
      setSubmitting(false);
      message.success('If that email exists, a reset link is on its way.');
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
      footer={
        <Link href="/login" className="text-primary">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-ink-muted">
          Check your inbox for a reset link. It expires in one hour.
        </p>
      ) : (
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input size="large" autoComplete="email" placeholder="you@example.com" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
            Send reset link
          </Button>
        </Form>
      )}
    </AuthShell>
  );
}
