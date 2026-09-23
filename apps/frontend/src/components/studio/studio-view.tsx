'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ContentStatus, type PublicAlbum, type PublicPhoto } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { AlbumManager } from './album-manager';

const STATUS_COLOR: Record<string, string> = {
  [ContentStatus.PUBLISHED]: 'green',
  [ContentStatus.DRAFT]: 'gold',
  [ContentStatus.ARCHIVED]: 'default',
};

export function StudioView() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">My content</h1>
        <Link href="/dashboard/upload">
          <Button type="primary">Upload photo</Button>
        </Link>
      </div>
      <Tabs
        items={[
          {
            key: 'photos',
            label: 'Photos',
            children: user ? <PhotosPanel photographerId={user.id} /> : null,
          },
          { key: 'albums', label: 'Albums', children: <AlbumsPanel /> },
        ]}
      />
    </div>
  );
}

/* ---------------- Photos ---------------- */

function PhotosPanel({ photographerId }: { photographerId: string }) {
  const { message } = App.useApp();
  const [photos, setPhotos] = useState<PublicPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PublicPhoto | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(() => {
    setLoading(true);
    client.studio
      .myPhotos(photographerId)
      .then((r) => setPhotos(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [photographerId]);
  useEffect(load, [load]);

  const openEdit = (p: PublicPhoto) => {
    setEditing(p);
    form.setFieldsValue({
      title: p.title,
      description: p.description ?? '',
      story: p.story ?? '',
      status: p.status,
    });
  };

  const save = async () => {
    if (!editing) return;
    const values = await form.validateFields();
    try {
      await client.studio.updatePhoto(editing.id, values);
      message.success('Photo updated');
      setEditing(null);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const remove = async (id: string) => {
    try {
      await client.studio.deletePhoto(id);
      message.success('Photo deleted');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const columns: ColumnsType<PublicPhoto> = [
    {
      title: '',
      width: 64,
      render: (_, p) => (
        <Image
          src={p.assets.thumbnail}
          alt={p.title}
          width={48}
          height={48}
          className="h-12 w-12 rounded object-cover"
          unoptimized
        />
      ),
    },
    { title: 'Title', dataIndex: 'title' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
    { title: 'Views', dataIndex: 'viewsCount', width: 80 },
    { title: 'Likes', dataIndex: 'likesCount', width: 80 },
    {
      title: '',
      width: 150,
      render: (_, p) => (
        <Space>
          <Button size="small" onClick={() => openEdit(p)}>
            Edit
          </Button>
          <Popconfirm title="Delete this photo?" onConfirm={() => remove(p.id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={photos}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
      <Modal
        title="Edit photo"
        open={!!editing}
        onOk={save}
        onCancel={() => setEditing(null)}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="story" label="Story">
            <Input.TextArea rows={3} />
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
        </Form>
      </Modal>
    </>
  );
}

/* ---------------- Albums ---------------- */

function AlbumsPanel() {
  const { message } = App.useApp();
  const [albums, setAlbums] = useState<PublicAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PublicAlbum | null>(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState<PublicAlbum | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(() => {
    setLoading(true);
    client.studio
      .albums()
      .then((r) => setAlbums(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const openModal = (a?: PublicAlbum) => {
    setEditing(a ?? null);
    setCreating(!a);
    form.setFieldsValue({
      title: a?.title ?? '',
      description: a?.description ?? '',
      status: a?.status ?? ContentStatus.DRAFT,
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    try {
      if (editing) await client.studio.updateAlbum(editing.id, values);
      else await client.studio.createAlbum(values);
      message.success(editing ? 'Album updated' : 'Album created');
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  const remove = async (id: string) => {
    try {
      await client.studio.deleteAlbum(id);
      message.success('Album deleted');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const columns: ColumnsType<PublicAlbum> = [
    { title: 'Title', dataIndex: 'title' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
    { title: 'Photos', dataIndex: 'photosCount', width: 80 },
    {
      title: '',
      width: 230,
      render: (_, a) => (
        <Space>
          <Button size="small" type="primary" ghost onClick={() => setManaging(a)}>
            Sell / pricing
          </Button>
          <Button size="small" onClick={() => openModal(a)}>
            Edit
          </Button>
          <Popconfirm title="Delete this album?" onConfirm={() => remove(a.id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="primary" onClick={() => openModal()}>
          New album
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={albums}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={creating ? 'New album' : 'Edit album'}
        open={!!editing || creating}
        onOk={save}
        onCancel={() => {
          setEditing(null);
          setCreating(false);
        }}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true, max: 200 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
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
        </Form>
      </Modal>

      {managing && (
        <AlbumManager
          album={managing}
          open={!!managing}
          onClose={() => {
            setManaging(null);
            load();
          }}
        />
      )}
    </>
  );
}
