'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CmsPageStatus } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import type { AdminCmsPage } from '@/lib/admin-types';

export default function AdminCmsPage() {
  const { message, modal } = App.useApp();
  const [pages, setPages] = useState<AdminCmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCmsPage | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    client.admin
      .cmsPages()
      .then(setPages)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const openEditor = (page: AdminCmsPage | null) => {
    setEditing(page);
    setOpen(true);
    form.setFieldsValue(
      page ?? {
        title: '',
        slug: '',
        body: '',
        status: CmsPageStatus.DRAFT,
        metaTitle: '',
        metaDescription: '',
      },
    );
  };

  const save = async (values: Record<string, unknown>) => {
    setBusy(true);
    try {
      if (editing) await client.admin.updateCmsPage(editing.id, values);
      else await client.admin.createCmsPage(values);
      message.success('Saved');
      setOpen(false);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) =>
    modal.confirm({
      title: 'Delete page?',
      onOk: async () => {
        await client.admin.deleteCmsPage(id).catch(() => undefined);
        load();
      },
    });

  const columns: ColumnsType<AdminCmsPage> = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Slug', dataIndex: 'slug', render: (s: string) => <code>/{s}</code> },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag color={s === CmsPageStatus.PUBLISHED ? 'green' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: '',
      render: (_, p) => (
        <Space>
          <Button size="small" onClick={() => openEditor(p)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => remove(p.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">CMS pages</h1>
        <Button type="primary" onClick={() => openEditor(null)}>
          New page
        </Button>
      </div>
      <Table
        rowKey="id"
        className="mt-6"
        loading={loading}
        dataSource={pages}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? `Edit: ${editing.title}` : 'New page'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={busy}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={save} requiredMark={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" tooltip="Leave blank to derive from title">
            <Input placeholder="about" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: CmsPageStatus.DRAFT, label: 'Draft' },
                { value: CmsPageStatus.PUBLISHED, label: 'Published' },
              ]}
            />
          </Form.Item>
          <Form.Item name="body" label="Body (Markdown)" rules={[{ required: true }]}>
            <Input.TextArea rows={8} />
          </Form.Item>
          <Form.Item name="metaTitle" label="Meta title">
            <Input />
          </Form.Item>
          <Form.Item name="metaDescription" label="Meta description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
