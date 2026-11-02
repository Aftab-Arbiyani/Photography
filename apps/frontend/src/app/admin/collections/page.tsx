'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ContentStatus, type PublicCollection } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

const STATUS_COLOR: Record<string, string> = {
  [ContentStatus.PUBLISHED]: 'green',
  [ContentStatus.DRAFT]: 'gold',
  [ContentStatus.ARCHIVED]: 'default',
};

export default function AdminCollectionsPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<PublicCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PublicCollection | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .collections()
      .then(setItems)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const openModal = (col?: PublicCollection) => {
    setEditing(col ?? null);
    form.setFieldsValue({
      title: col?.title ?? '',
      description: col?.description ?? '',
      status: col?.status ?? ContentStatus.DRAFT,
      isCurated: col?.isCurated ?? false,
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) await client.admin.updateCollection(editing.id, values);
      else await client.admin.createCollection(values);
      message.success(editing ? 'Collection updated' : 'Collection created');
      setOpen(false);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const remove = async (id: string) => {
    try {
      await client.admin.deleteCollection(id);
      message.success('Collection deleted');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const columns: ColumnsType<PublicCollection> = [
    { title: 'Title', dataIndex: 'title' },
    {
      title: 'Slug',
      dataIndex: 'slug',
      render: (s: string) => <code className="text-xs">{s}</code>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
    {
      title: 'Curated',
      dataIndex: 'isCurated',
      render: (c: boolean) => (c ? <Tag color="purple">curated</Tag> : '—'),
    },
    { title: 'Photos', dataIndex: 'photosCount', width: 90 },
    {
      title: '',
      width: 140,
      render: (_, col) => (
        <Space>
          <Button size="small" onClick={() => openModal(col)}>
            Edit
          </Button>
          <Popconfirm title="Delete this collection?" onConfirm={() => remove(col.id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Collections</h1>
        <Button type="primary" onClick={() => openModal()}>
          New collection
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
        title={editing ? 'Edit collection' : 'New collection'}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText="Save"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true, max: 200 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} maxLength={4000} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: ContentStatus.DRAFT, label: 'Draft' },
                { value: ContentStatus.PUBLISHED, label: 'Published' },
                { value: ContentStatus.ARCHIVED, label: 'Archived' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="isCurated"
            label="Curated (featured in discovery)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
