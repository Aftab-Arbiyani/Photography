'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiError, client } from '@/lib/api-client';
import type { AdminFeatureFlag, AdminSetting } from '@/lib/admin-types';

export default function AdminSettingsPage() {
  const { message } = App.useApp();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [flags, setFlags] = useState<AdminFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      client.admin
        .settings()
        .then(setSettings)
        .catch(() => undefined),
      client.admin
        .featureFlags()
        .then(setFlags)
        .catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const saveFlag = async (flag: AdminFeatureFlag, patch: Partial<AdminFeatureFlag>) => {
    const next = { ...flag, ...patch };
    setFlags((prev) => prev.map((f) => (f.id === flag.id ? next : f)));
    try {
      await client.admin.setFeatureFlag({
        key: flag.key,
        enabled: next.enabled,
        rolloutPercentage: next.rolloutPercentage,
        description: flag.description,
      });
      message.success(`Flag “${flag.key}” saved`);
    } catch {
      message.error('Save failed');
      load();
    }
  };

  const [editing, setEditing] = useState<AdminSetting | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const openSetting = (s?: AdminSetting) => {
    setEditing(s ?? null);
    setCreating(!s);
    form.setFieldsValue({
      key: s?.key ?? '',
      value: s ? JSON.stringify(s.value) : '',
      category: s?.category ?? 'general',
      description: s?.description ?? '',
      isPublic: s?.isPublic ?? false,
    });
  };

  const saveSetting = async () => {
    const values = await form.validateFields();
    let parsed: unknown;
    try {
      parsed = JSON.parse(values.value);
    } catch {
      parsed = values.value; // accept raw strings
    }
    try {
      await client.admin.setSetting({
        key: values.key,
        value: parsed,
        category: values.category,
        description: values.description || undefined,
        isPublic: values.isPublic,
      });
      message.success('Setting saved');
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const deleteSetting = async (key: string) => {
    try {
      await client.admin.deleteSetting(key);
      message.success('Setting deleted');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const settingCols: ColumnsType<AdminSetting> = [
    { title: 'Key', dataIndex: 'key', render: (k: string) => <code>{k}</code> },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (v: unknown) => <span className="text-sm">{JSON.stringify(v)}</span>,
    },
    { title: 'Category', dataIndex: 'category', render: (c: string) => <Tag>{c}</Tag> },
    {
      title: 'Public',
      dataIndex: 'isPublic',
      render: (p: boolean) => (p ? <Tag color="green">public</Tag> : <Tag>private</Tag>),
    },
    {
      title: '',
      width: 130,
      render: (_, s) => (
        <Space>
          <Button size="small" onClick={() => openSetting(s)}>
            Edit
          </Button>
          <Popconfirm title="Delete this setting?" onConfirm={() => deleteSetting(s.key)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const flagCols: ColumnsType<AdminFeatureFlag> = [
    { title: 'Flag', dataIndex: 'key', render: (k: string) => <code>{k}</code> },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (d: string | null) => <span className="text-sm text-ink-muted">{d}</span>,
    },
    {
      title: 'Enabled',
      render: (_, f) => (
        <Switch size="small" checked={f.enabled} onChange={(v) => saveFlag(f, { enabled: v })} />
      ),
    },
    {
      title: 'Rollout %',
      render: (_, f) => (
        <InputNumber
          size="small"
          min={0}
          max={100}
          value={f.rolloutPercentage}
          onChange={(v) => saveFlag(f, { rolloutPercentage: v ?? 100 })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-lg font-semibold tracking-tight">
          Settings &amp; flags
        </h1>
      </div>

      <Card title="Feature flags">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={flags}
          columns={flagCols}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card
        title="Platform settings"
        extra={
          <Space>
            <Button size="small" type="primary" onClick={() => openSetting()}>
              New setting
            </Button>
            <Button size="small" onClick={load}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={settings}
          columns={settingCols}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={creating ? 'New setting' : `Edit ${editing?.key ?? ''}`}
        open={!!editing || creating}
        onOk={saveSetting}
        onCancel={() => {
          setEditing(null);
          setCreating(false);
        }}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="key" label="Key" rules={[{ required: true }]}>
            <Input disabled={!creating} placeholder="commerce.tax_basis_points" />
          </Form.Item>
          <Form.Item
            name="value"
            label="Value (JSON or plain text)"
            rules={[{ required: true }]}
            extra='Numbers, booleans, objects must be valid JSON (e.g. 700, true, "hello").'
          >
            <Input.TextArea rows={3} className="font-mono text-xs" />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input placeholder="general" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>
          <Form.Item
            name="isPublic"
            label="Public (exposed to the frontend)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
