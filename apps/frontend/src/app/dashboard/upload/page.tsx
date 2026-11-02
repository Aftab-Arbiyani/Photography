'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { App, Button, Card, Form, Input, Select, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { ContentStatus, type PublicCategory, type PublicPhoto, UserRole } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { features } from '@/lib/config';

export default function UploadPage() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState<PublicPhoto | null>(null);

  useEffect(() => {
    client
      .categories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  const canUpload = user && (user.role === UserRole.PHOTOGRAPHER || user.role === UserRole.ADMIN);

  if (!canUpload) {
    return (
      <Card>
        <h1 className="font-display text-tagline font-semibold">Uploads are closed</h1>
        {features.photographerApplications ? (
          <p className="mt-2 text-sm text-ink-muted">
            You need an approved photographer account to upload.{' '}
            <Link href="/dashboard/photographer" className="text-primary">
              Apply here
            </Link>
            .
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Uploading is limited to administrators.</p>
        )}
      </Card>
    );
  }

  const onFinish = async (values: Record<string, string>) => {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      message.error('Choose an image to upload');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', values.title);
    if (values.description) fd.append('description', values.description);
    if (values.story) fd.append('story', values.story);
    fd.append('status', values.status ?? ContentStatus.PUBLISHED);
    if (values.categoryId) fd.append('categoryId', values.categoryId);

    setSubmitting(true);
    try {
      const photo = await client.uploadPhoto(fd);
      setUploaded(photo);
      form.resetFields();
      setFileList([]);
      message.success('Photo uploaded');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Upload a photo</h1>
      <p className="mt-2 text-ink-muted">
        Originals are processed into WebP/AVIF + thumbnail with EXIF extracted automatically.
      </p>

      <Card className="mt-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ status: ContentStatus.PUBLISHED }}
        >
          <Form.Item label="Image" required>
            <Upload.Dragger
              accept="image/*"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag an image here</p>
              <p className="ant-upload-hint">JPEG/PNG/WebP/AVIF/TIFF · up to 25&nbsp;MB</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item name="title" label="Title" rules={[{ required: true, max: 200 }]}>
            <Input size="large" placeholder="Golden Hour Over Patagonia" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} maxLength={4000} />
          </Form.Item>
          <Form.Item
            name="story"
            label="Extended caption (optional)"
            extra="Longer notes shown under the description, collapsed behind “Read more”."
          >
            <Input.TextArea rows={4} maxLength={20000} />
          </Form.Item>
          <div className="flex gap-3">
            <Form.Item name="categoryId" label="Category" className="flex-1">
              <Select
                allowClear
                placeholder="Select…"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
            <Form.Item name="status" label="Status" className="flex-1">
              <Select
                options={[
                  { value: ContentStatus.PUBLISHED, label: 'Published' },
                  { value: ContentStatus.DRAFT, label: 'Draft' },
                ]}
              />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" size="large" loading={submitting}>
            Upload
          </Button>
        </Form>

        {uploaded && (
          <p className="mt-4 text-sm text-ink-muted">
            Uploaded:{' '}
            <Link href={`/photos/${uploaded.slug}`} className="text-primary">
              {uploaded.title}
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
