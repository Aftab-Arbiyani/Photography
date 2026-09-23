'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReportStatus, type PublicReport } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

export default function AdminReportsPage() {
  const { message } = App.useApp();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .reports()
      .then((r) => setReports(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const resolve = async (id: string, status: ReportStatus) => {
    try {
      await client.admin.resolveReport(id, status);
      message.success(`Report ${status}`);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const columns: ColumnsType<PublicReport> = [
    {
      title: 'Target',
      render: (_, r) => (
        <span>
          <Tag>{r.targetType}</Tag>
          <span className="text-xs text-ink-muted">{r.targetId.slice(0, 8)}…</span>
        </span>
      ),
    },
    { title: 'Reason', dataIndex: 'reason', render: (s: string) => <Tag color="orange">{s}</Tag> },
    {
      title: 'Details',
      dataIndex: 'details',
      render: (d: string | null) => <span className="line-clamp-2 max-w-md">{d ?? '—'}</span>,
    },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
    {
      title: '',
      render: (_, r) =>
        r.status === ReportStatus.PENDING || r.status === ReportStatus.REVIEWING ? (
          <Space>
            <Button
              size="small"
              type="primary"
              onClick={() => resolve(r.id, ReportStatus.RESOLVED)}
            >
              Resolve
            </Button>
            <Button size="small" onClick={() => resolve(r.id, ReportStatus.DISMISSED)}>
              Dismiss
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Moderation</h1>
      <Table
        rowKey="id"
        className="mt-6"
        loading={loading}
        dataSource={reports}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
