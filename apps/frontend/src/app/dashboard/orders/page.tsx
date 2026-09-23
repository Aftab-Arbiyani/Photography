'use client';

import { useEffect, useState } from 'react';
import { App, Button, Table, Tag } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { OrderStatus, type PublicOrder } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  );

const STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PAID]: 'green',
  [OrderStatus.PENDING]: 'gold',
  [OrderStatus.FAILED]: 'red',
  [OrderStatus.REFUNDED]: 'volcano',
  [OrderStatus.PARTIALLY_REFUNDED]: 'orange',
  [OrderStatus.CANCELLED]: 'default',
};

export default function OrdersPage() {
  const { message } = App.useApp();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    client
      .myOrders(1)
      .then((r) => setOrders(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const downloadInvoice = async (o: PublicOrder) => {
    setDownloading(o.id);
    try {
      const blob = await client.invoicePdf(o.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${o.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const columns: ColumnsType<PublicOrder> = [
    { title: 'Invoice', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    {
      title: 'Items',
      key: 'items',
      render: (_, o) => o.items.map((i) => i.albumTitle).join(', ') || '—',
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, o) => money(o.totalCents, o.currency),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: OrderStatus) => <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Invoice',
      key: 'pdf',
      render: (_, o) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          loading={downloading === o.id}
          onClick={() => downloadInvoice(o)}
        >
          PDF
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Orders</h1>
      <p className="mt-2 mb-6 text-ink-muted">Your purchase history and invoices.</p>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
        pagination={false}
        locale={{ emptyText: 'No orders yet' }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
