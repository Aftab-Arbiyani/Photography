'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PublicCategory } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

export default function AdminCategoriesPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PublicCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(() => {
    setLoading(true);
    client
      .categories()
      .then(setItems)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const openModal = (cat?: PublicCategory) => {
    setEditing(cat ?? null);
    form.setFieldsValue({ name: cat?.name ?? '', description: cat?.description ?? '' });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) await client.admin.updateCategory(editing.id, values);
      else await client.admin.createCategory(values);
      message.success(editing ? 'Category updated' : 'Category created');
      setOpen(false);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const remove = async (id: string) => {
    try {
      await client.admin.deleteCategory(id);
      message.success('Category deleted');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const columns: ColumnsType<PublicCategory> = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Slug',
      dataIndex: 'slug',
      render: (s: string) => <code className="text-xs">{s}</code>,
    },
    { title: 'Photos', dataIndex: 'photosCount', width: 90 },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (d: string | null) => <span className="text-sm text-ink-muted">{d ?? '—'}</span>,
    },
    {
      title: '',
      width: 140,
      render: (_, cat) => (
        <Space>
          <Button size="small" onClick={() => openModal(cat)}>
            Edit
          </Button>
          <Popconfirm title="Delete this category?" onConfirm={() => remove(cat.id)}>
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
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Categories</h1>
        <Button type="primary" onClick={() => openModal()}>
          New category
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
        title={editing ? 'Edit category' : 'New category'}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText="Save"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true, max: 120 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
