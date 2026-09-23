'use client';

import { useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { client } from '@/lib/api-client';
import type { AdminAuditLog } from '@/lib/admin-types';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.admin
      .auditLogs(1)
      .then((r) => setLogs(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<AdminAuditLog> = [
    { title: 'When', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleString() },
    {
      title: 'Actor',
      dataIndex: 'actorId',
      render: (a: string | null) => (a ? <span className="text-xs">{a.slice(0, 8)}…</span> : '—'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (a: string) => <code className="text-xs">{a}</code>,
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      render: (s: number | null) =>
        s ? <Tag color={s < 400 ? 'green' : s < 500 ? 'orange' : 'red'}>{s}</Tag> : '—',
    },
    { title: 'IP', dataIndex: 'ipAddress', render: (ip: string | null) => ip ?? '—' },
  ];

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Audit log</h1>
      <p className="mt-2 mb-6 text-ink-muted">
        Authenticated state-changing requests (most recent first).
      </p>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={logs}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
