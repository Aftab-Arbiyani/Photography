'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, InputNumber, Modal, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { OrderStatus, type PublicOrder } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';

export default function AdminOrdersPage() {
  const { message } = App.useApp();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundFor, setRefundFor] = useState<PublicOrder | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .orders(1)
      .then((r) => setOrders(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  // Page through every order and download a CSV sales report client-side.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: PublicOrder[] = [];
      for (let page = 1; page <= 200; page += 1) {
        const res = await client.admin.orders(page);
        rows.push(...res.items);
        if (res.items.length === 0 || !res.meta.hasNextPage) break;
      }
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = [
        'Invoice',
        'Status',
        'Items',
        'Subtotal',
        'Discount',
        'Coupon',
        'Tax',
        'Total',
        'Currency',
        'Coupon code',
        'Date',
      ];
      const lines = rows.map((o) =>
        [
          o.invoiceNumber,
          o.status,
          o.items.map((i) => i.albumTitle).join(' | '),
          (o.subtotalCents / 100).toFixed(2),
          (o.discountCents / 100).toFixed(2),
          (o.couponCents / 100).toFixed(2),
          (o.taxCents / 100).toFixed(2),
          (o.totalCents / 100).toFixed(2),
          o.currency,
          o.couponCode ?? '',
          new Date(o.createdAt).toISOString(),
        ]
          .map(esc)
          .join(','),
      );
      const csv = [header.map(esc).join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success(`Exported ${rows.length} orders`);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const refund = async () => {
    if (!refundFor) return;
    setBusy(true);
    try {
      await client.admin.refund(refundFor.id, amount ? amount * 100 : undefined);
      message.success('Refund processed');
      setRefundFor(null);
      setAmount(null);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Refund failed');
    } finally {
      setBusy(false);
    }
  };

  const columns: ColumnsType<PublicOrder> = [
    { title: 'Invoice', dataIndex: 'invoiceNumber' },
    { title: 'Items', render: (_, o) => o.items.map((i) => i.albumTitle).join(', ') || '—' },
    { title: 'Total', render: (_, o) => formatMoney(o.totalCents, o.currency) },
    { title: 'Status', dataIndex: 'status', render: (s: OrderStatus) => <Tag>{s}</Tag> },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: '',
      render: (_, o) =>
        o.status === OrderStatus.PAID || o.status === OrderStatus.PARTIALLY_REFUNDED ? (
          <Button size="small" danger onClick={() => setRefundFor(o)}>
            Refund
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Orders</h1>
        <Button loading={exporting} onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
      <Table
        rowKey="id"
        className="mt-6"
        loading={loading}
        dataSource={orders}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={`Refund ${refundFor?.invoiceNumber ?? ''}`}
        open={!!refundFor}
        onCancel={() => setRefundFor(null)}
        onOk={refund}
        confirmLoading={busy}
        okText="Refund"
        okButtonProps={{ danger: true }}
      >
        <p className="mb-3 text-sm text-ink-muted">
          Leave blank for a full refund (
          {refundFor ? formatMoney(refundFor.totalCents, refundFor.currency) : ''}).
        </p>
        <InputNumber
          addonBefore="$"
          min={0}
          value={amount ?? undefined}
          onChange={(v) => setAmount(v)}
          placeholder="Partial amount"
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
}
