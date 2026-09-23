'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Input, Select, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserRole, type PublicUser } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

export default function AdminUsersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .users(1, search || undefined)
      .then((r) => setUsers(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [search]);
  useEffect(load, [load]);

  const update = async (id: string, body: { role?: string; isEmailVerified?: boolean }) => {
    try {
      const updated = await client.admin.updateUser(id, body);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      message.success('User updated');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const columns: ColumnsType<PublicUser> = [
    { title: 'Email', dataIndex: 'email' },
    { title: 'Name', render: (_, u) => u.displayName },
    {
      title: 'Role',
      render: (_, u) => (
        <Select
          size="small"
          value={u.role}
          style={{ width: 140 }}
          onChange={(role) => update(u.id, { role })}
          options={[
            { value: UserRole.USER, label: 'user' },
            { value: UserRole.PHOTOGRAPHER, label: 'photographer' },
            { value: UserRole.ADMIN, label: 'admin' },
          ]}
        />
      ),
    },
    {
      title: 'Verified',
      render: (_, u) => (
        <Switch
          size="small"
          checked={u.isEmailVerified}
          onChange={(v) => update(u.id, { isEmailVerified: v })}
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Users</h1>
        <Input.Search placeholder="Search…" allowClear className="max-w-xs" onSearch={setSearch} />
      </div>
      <Table
        rowKey="id"
        className="mt-6"
        loading={loading}
        dataSource={users}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
