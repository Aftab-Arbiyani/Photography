'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Form, InputNumber, Input, Modal, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CouponType } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import type { AdminCoupon } from '@/lib/admin-types';

export default function AdminCouponsPage() {
  const { message, modal } = App.useApp();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .coupons()
      .then(setCoupons)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const create = async (values: Record<string, unknown>) => {
    setBusy(true);
    try {
      await client.admin.createCoupon(values);
      message.success('Coupon created');
      setOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) =>
    modal.confirm({
      title: 'Delete coupon?',
      onOk: async () => {
        await client.admin.deleteCoupon(id).catch(() => undefined);
        load();
      },
    });

  const columns: ColumnsType<AdminCoupon> = [
    { title: 'Code', dataIndex: 'code', render: (c: string) => <Tag color="blue">{c}</Tag> },
    { title: 'Type', dataIndex: 'type' },
    {
      title: 'Value',
      render: (_, c) =>
        c.type === CouponType.PERCENT ? `${c.value}%` : `${(c.value / 100).toFixed(2)}`,
    },
    {
      title: 'Redeemed',
      render: (_, c) => `${c.redeemedCount}${c.maxRedemptions ? `/${c.maxRedemptions}` : ''}`,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      render: (a: boolean) => <Tag color={a ? 'green' : 'default'}>{a ? 'yes' : 'no'}</Tag>,
    },
    {
      title: '',
      render: (_, c) => (
        <Button size="small" danger onClick={() => remove(c.id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Coupons</h1>
        <Button type="primary" onClick={() => setOpen(true)}>
          New coupon
        </Button>
      </div>
      <Table
        rowKey="id"
        className="mt-6"
        loading={loading}
        dataSource={coupons}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="New coupon"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={busy}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={create}
          initialValues={{ type: CouponType.PERCENT, value: 10 }}
          requiredMark={false}
        >
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input placeholder="LAUNCH20" />
          </Form.Item>
          <Form.Item name="type" label="Type">
            <Select
              options={[
                { value: CouponType.PERCENT, label: 'Percent' },
                { value: CouponType.FIXED, label: 'Fixed (cents)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="value" label="Value" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="minSubtotalCents" label="Min subtotal (cents)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxRedemptions" label="Max redemptions">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
