'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Form, Input, Modal, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiError, client } from '@/lib/api-client';
import type { AdminEmailTemplate } from '@/lib/admin-types';

export default function AdminEmailTemplatesPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<AdminEmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminEmailTemplate | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .emailTemplates()
      .then(setItems)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const openModal = (t?: AdminEmailTemplate) => {
    setEditing(t ?? null);
    form.setFieldsValue({
      key: t?.key ?? '',
      subject: t?.subject ?? '',
      htmlBody: t?.htmlBody ?? '',
      variables: (t?.variables ?? []).join(', '),
      isActive: t?.isActive ?? true,
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const variables = String(values.variables ?? '')
      .split(',')
      .map((v: string) => v.trim())
      .filter(Boolean);
    try {
      await client.admin.setEmailTemplate({ ...values, variables });
      message.success('Template saved');
      setOpen(false);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const columns: ColumnsType<AdminEmailTemplate> = [
    { title: 'Key', dataIndex: 'key', render: (k: string) => <code className="text-xs">{k}</code> },
    { title: 'Subject', dataIndex: 'subject' },
    {
      title: 'Variables',
      dataIndex: 'variables',
      render: (v: string[]) => v.map((x) => <Tag key={x}>{`{{${x}}}`}</Tag>),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      render: (a: boolean) => (a ? <Tag color="green">active</Tag> : <Tag>off</Tag>),
    },
    {
      title: '',
      width: 90,
      render: (_, t) => (
        <Button size="small" onClick={() => openModal(t)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">
          Email templates
        </h1>
        <Button type="primary" onClick={() => openModal()}>
          New template
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? `Edit ${editing.key}` : 'New template'}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText="Save"
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="key"
            label="Key (unique identifier)"
            rules={[{ required: true, max: 120 }]}
          >
            <Input placeholder="purchase_successful" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true, max: 200 }]}>
            <Input placeholder="Your purchase is ready, {{firstName}}" />
          </Form.Item>
          <Form.Item name="variables" label="Variables (comma-separated)">
            <Input placeholder="firstName, orderNumber, downloadUrl" />
          </Form.Item>
          <Form.Item name="htmlBody" label="HTML body" rules={[{ required: true }]}>
            <Input.TextArea
              rows={12}
              className="font-mono text-xs"
              placeholder="<p>Hi {{firstName}}…</p>"
            />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space className="text-xs text-ink-muted">
            Use <code>{'{{variable}}'}</code> placeholders; they are substituted at send time.
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
