'use client';

import { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input } from 'antd';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { message } = App.useApp();
  const [profileForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
      });
    }
  }, [user, profileForm]);

  const saveProfile = async (values: Record<string, string>) => {
    setSavingProfile(true);
    try {
      await client.updateProfile(values);
      await refreshUser();
      message.success('Profile updated');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (values: { currentPassword: string; newPassword: string }) => {
    setSavingPw(true);
    try {
      await client.changePassword(values.currentPassword, values.newPassword);
      pwForm.resetFields();
      message.success('Password changed');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Profile</h1>

      <Card className="mt-6" title="Your details">
        <Form form={profileForm} layout="vertical" onFinish={saveProfile} requiredMark={false}>
          <div className="flex gap-3">
            <Form.Item name="firstName" label="First name" className="flex-1">
              <Input size="large" />
            </Form.Item>
            <Form.Item name="lastName" label="Last name" className="flex-1">
              <Input size="large" />
            </Form.Item>
          </div>
          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item
            name="avatarUrl"
            label="Avatar URL"
            rules={[{ type: 'url', message: 'Enter a valid URL' }]}
          >
            <Input size="large" placeholder="https://…" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={savingProfile}>
            Save changes
          </Button>
        </Form>
      </Card>

      <Card className="mt-6" title="Change password">
        <Form form={pwForm} layout="vertical" onFinish={changePassword} requiredMark={false}>
          <Form.Item name="currentPassword" label="Current password" rules={[{ required: true }]}>
            <Input.Password size="large" autoComplete="current-password" />
          </Form.Item>
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
            <Input.Password size="large" autoComplete="new-password" />
          </Form.Item>
          <Button htmlType="submit" loading={savingPw}>
            Update password
          </Button>
        </Form>
      </Card>
    </div>
  );
}
