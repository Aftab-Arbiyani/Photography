'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, InputNumber, Modal, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserRole,
  VerificationStatus,
  type PublicPhotographerProfile,
  type PublicUser,
} from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

const VERIFY_COLOR: Record<string, string> = {
  [VerificationStatus.VERIFIED]: 'green',
  [VerificationStatus.PENDING]: 'gold',
  [VerificationStatus.REJECTED]: 'red',
  [VerificationStatus.UNVERIFIED]: 'default',
};

export default function AdminPhotographersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PublicUser | null>(null);
  const [profile, setProfile] = useState<PublicPhotographerProfile | null>(null);
  const [rate, setRate] = useState<number>(20);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    // No server role filter — pull the first pages and keep photographers.
    client.admin
      .users(1)
      .then((r) => setUsers(r.items.filter((u) => u.role === UserRole.PHOTOGRAPHER)))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const openCommission = async (u: PublicUser) => {
    setEditing(u);
    setProfile(null);
    try {
      const p = await client.admin.photographerProfile(u.id);
      setProfile(p);
      setRate(Math.round(p.commissionRate * 100));
    } catch {
      setRate(20);
    }
  };

  const saveCommission = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await client.admin.setCommission(editing.id, rate / 100);
      message.success(`Commission set to ${rate}%`);
      setEditing(null);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const verify = async (u: PublicUser, status: VerificationStatus) => {
    try {
      await client.admin.verifyPhotographer(u.id, status);
      message.success('Verification updated');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const columns: ColumnsType<PublicUser> = [
    { title: 'Photographer', dataIndex: 'displayName' },
    {
      title: 'Email',
      dataIndex: 'email',
      render: (e: string) => <span className="text-xs">{e}</span>,
    },
    {
      title: 'Commission',
      width: 130,
      render: (_, u) => (
        <Button size="small" onClick={() => openCommission(u)}>
          Set commission
        </Button>
      ),
    },
    {
      title: 'Verify',
      width: 220,
      render: (_, u) => (
        <div className="flex gap-1">
          <Button size="small" onClick={() => verify(u, VerificationStatus.VERIFIED)}>
            Verify
          </Button>
          <Button size="small" danger onClick={() => verify(u, VerificationStatus.REJECTED)}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Photographers</h1>
      <p className="mt-2 mb-6 text-ink-muted">
        Set per-photographer commission rates and verification status.
      </p>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={users}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? `Commission — ${editing.displayName}` : 'Commission'}
        open={!!editing}
        onOk={saveCommission}
        confirmLoading={saving}
        onCancel={() => setEditing(null)}
        okText="Save"
      >
        {profile && (
          <p className="mb-3 text-sm text-ink-muted">
            Current: {Math.round(profile.commissionRate * 100)}% platform cut ·{' '}
            <Tag color={VERIFY_COLOR[profile.verificationStatus]}>{profile.verificationStatus}</Tag>
          </p>
        )}
        <label className="mb-1 block text-sm">Platform commission (%)</label>
        <InputNumber
          min={0}
          max={90}
          value={rate}
          onChange={(v) => setRate(v ?? 0)}
          className="w-full"
          addonAfter="%"
        />
        <p className="mt-2 text-xs text-ink-muted">
          The photographer keeps {100 - rate}% of each sale.
        </p>
      </Modal>
    </div>
  );
}
