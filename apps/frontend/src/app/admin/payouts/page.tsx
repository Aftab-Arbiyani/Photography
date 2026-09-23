'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Input, Modal, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PayoutStatus, type PublicPayout } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';

export default function AdminPayoutsPage() {
  const { message } = App.useApp();
  const [payouts, setPayouts] = useState<PublicPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFor, setPayFor] = useState<PublicPayout | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .payouts()
      .then((r) => setPayouts(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const process = async (id: string, status: PayoutStatus, ref?: string) => {
    setBusy(true);
    try {
      await client.admin.processPayout(id, status, ref);
      message.success(`Payout ${status}`);
      setPayFor(null);
      setReference('');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const columns: ColumnsType<PublicPayout> = [
    { title: 'Amount', render: (_, p) => formatMoney(p.amountCents, p.currency) },
    { title: 'Method', dataIndex: 'method', render: (m: string) => <Tag>{m}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: '',
      render: (_, p) =>
        p.status === PayoutStatus.REQUESTED || p.status === PayoutStatus.PROCESSING ? (
          <Space>
            <Button size="small" type="primary" onClick={() => setPayFor(p)}>
              Mark paid
            </Button>
            <Button size="small" danger onClick={() => process(p.id, PayoutStatus.FAILED)}>
              Fail
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Payouts</h1>
      <Table
        rowKey="id"
        className="mt-6"
        loading={loading}
        dataSource={payouts}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="Mark payout paid"
        open={!!payFor}
        onCancel={() => setPayFor(null)}
        confirmLoading={busy}
        onOk={() => payFor && process(payFor.id, PayoutStatus.PAID, reference)}
        okText="Confirm paid"
      >
        <p className="mb-2 text-sm text-ink-muted">Optional external transfer reference:</p>
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. Stripe transfer id"
        />
      </Modal>
    </div>
  );
}
