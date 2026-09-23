'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApplicationStatus, type PublicPhotographerApplication } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

export default function AdminApplicationsPage() {
  const { message, modal } = App.useApp();
  const [apps, setApps] = useState<PublicPhotographerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .applications()
      .then((r) => setApps(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const review = async (id: string, status: ApplicationStatus) => {
    try {
      await client.admin.reviewApplication(id, status);
      message.success(`Application ${status}`);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const columns: ColumnsType<PublicPhotographerApplication> = [
    {
      title: 'User',
      dataIndex: 'userId',
      render: (id: string) => <span className="text-xs">{id.slice(0, 8)}…</span>,
    },
    {
      title: 'Statement',
      dataIndex: 'statement',
      render: (s: string | null) => <span className="line-clamp-2 max-w-md">{s}</span>,
    },
    {
      title: 'Portfolio',
      dataIndex: 'portfolioUrl',
      render: (u: string | null) =>
        u ? (
          <a href={u} target="_blank" rel="noreferrer" className="text-primary">
            link
          </a>
        ) : (
          '—'
        ),
    },
    { title: 'Status', dataIndex: 'status', render: (s: ApplicationStatus) => <Tag>{s}</Tag> },
    {
      title: '',
      render: (_, a) =>
        a.status === ApplicationStatus.PENDING || a.status === ApplicationStatus.UNDER_REVIEW ? (
          <Space>
            <Button
              size="small"
              type="primary"
              onClick={() => review(a.id, ApplicationStatus.APPROVED)}
            >
              Approve
            </Button>
            <Button
              size="small"
              danger
              onClick={() =>
                modal.confirm({
                  title: 'Reject application?',
                  onOk: () => review(a.id, ApplicationStatus.REJECTED),
                })
              }
            >
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">
        Photographer applications
      </h1>
      <Table
        rowKey="id"
        className="mt-6"
        loading={loading}
        dataSource={apps}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
