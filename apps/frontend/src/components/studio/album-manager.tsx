'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  AssetType,
  LicenseType,
  type MarketplaceAlbum,
  type PublicAlbum,
  type PublicAlbumAsset,
  type PublicAlbumPricing,
} from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';

interface AlbumManagerProps {
  album: PublicAlbum;
  open: boolean;
  onClose: () => void;
}

/** Drawer to manage one album's sale settings, pricing tiers and deliverable assets. */
export function AlbumManager({ album, open, onClose }: AlbumManagerProps) {
  const { message } = App.useApp();
  const [settingsForm] = Form.useForm();
  const [pricing, setPricing] = useState<PublicAlbumPricing[]>([]);
  const [assets, setAssets] = useState<PublicAlbumAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pricingForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      client
        .marketplaceAlbum(album.slug)
        .then((a: MarketplaceAlbum) => {
          setPricing(a.pricing);
          settingsForm.setFieldsValue({
            isForSale: a.isForSale,
            isFeatured: a.isFeatured,
            discountPercent: a.discountPercent,
            discountActive: a.discountActive,
            trailerUrl: a.trailerUrl ?? '',
          });
        })
        .catch(() => undefined),
      client.studio
        .listAssets(album.id)
        .then(setAssets)
        .catch(() => setAssets([])),
    ]).finally(() => setLoading(false));
  }, [open, album.slug, album.id, settingsForm]);
  useEffect(load, [load]);

  const saveSettings = async () => {
    const values = await settingsForm.validateFields();
    setSavingSettings(true);
    try {
      await client.studio.updateAlbumSettings(album.id, {
        ...values,
        trailerUrl: values.trailerUrl || undefined,
      });
      message.success('Sale settings saved');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSavingSettings(false);
    }
  };

  const addPricing = async () => {
    const values = await pricingForm.validateFields();
    try {
      await client.studio.addPricing(album.id, {
        name: values.name,
        licenseType: values.licenseType,
        priceCents: Math.round(values.price * 100),
        downloadLimit: values.downloadLimit ?? 0,
        includesRaw: values.includesRaw ?? false,
        isDefault: values.isDefault ?? false,
      });
      message.success('Pricing tier added');
      pricingForm.resetFields();
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not add tier');
    }
  };

  const deletePricing = async (id: string) => {
    try {
      await client.studio.deletePricing(album.id, id);
      message.success('Tier removed');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  // Deliverable upload: sign → PUT to storage → register.
  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    setUploading(true);
    try {
      const { uploadUrl, storageKey } = await client.studio.signAssetUpload(album.id, {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      });
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      await client.studio.registerAsset(album.id, {
        type: AssetType.HIGH_RES,
        storageKey,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });
      message.success(`Uploaded ${file.name}`);
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE;
  };

  const deleteAsset = async (id: string) => {
    try {
      await client.studio.deleteAsset(album.id, id);
      message.success('Deliverable removed');
      load();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <Drawer
      title={`Manage — ${album.title}`}
      open={open}
      onClose={onClose}
      width={620}
      loading={loading}
    >
      <h3 className="mb-3 font-display text-lg font-semibold">Sale settings</h3>
      <Form form={settingsForm} layout="vertical" requiredMark={false}>
        <Space size="large" wrap>
          <Form.Item name="isForSale" label="For sale" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isFeatured" label="Featured" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="discountActive" label="Discount on" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="discountPercent" label="Discount %">
            <InputNumber min={0} max={100} />
          </Form.Item>
        </Space>
        <Form.Item name="trailerUrl" label="Trailer URL">
          <Input placeholder="https://…" />
        </Form.Item>
        <Button type="primary" loading={savingSettings} onClick={saveSettings}>
          Save settings
        </Button>
      </Form>

      <Divider />

      <h3 className="mb-3 font-display text-lg font-semibold">Pricing tiers</h3>
      <Table
        rowKey="id"
        dataSource={pricing}
        pagination={false}
        size="small"
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'License', dataIndex: 'licenseType', render: (l: string) => <Tag>{l}</Tag> },
          {
            title: 'Price',
            dataIndex: 'priceCents',
            render: (c: number, r) => formatMoney(c, r.currency),
          },
          {
            title: 'Downloads',
            dataIndex: 'downloadLimit',
            render: (n: number) => (n === 0 ? 'Unlimited' : n),
          },
          { title: 'RAW', dataIndex: 'includesRaw', render: (b: boolean) => (b ? '✓' : '—') },
          {
            title: 'Default',
            dataIndex: 'isDefault',
            render: (b: boolean) => (b ? <Tag color="blue">default</Tag> : ''),
          },
          {
            title: '',
            render: (_, r) => (
              <Popconfirm title="Remove this tier?" onConfirm={() => deletePricing(r.id)}>
                <Button size="small" danger>
                  Remove
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
      <Form form={pricingForm} layout="inline" className="mt-4 flex-wrap gap-2">
        <Form.Item name="name" rules={[{ required: true }]}>
          <Input placeholder="Tier name" />
        </Form.Item>
        <Form.Item name="licenseType" initialValue={LicenseType.STANDARD}>
          <Select
            style={{ width: 130 }}
            options={Object.values(LicenseType).map((v) => ({ value: v, label: v }))}
          />
        </Form.Item>
        <Form.Item name="price" rules={[{ required: true }]}>
          <InputNumber min={0} step={1} placeholder="Price" addonBefore="$" />
        </Form.Item>
        <Form.Item name="downloadLimit">
          <InputNumber min={0} placeholder="DL limit" />
        </Form.Item>
        <Form.Item name="includesRaw" valuePropName="checked" label="RAW">
          <Switch size="small" />
        </Form.Item>
        <Form.Item name="isDefault" valuePropName="checked" label="Default">
          <Switch size="small" />
        </Form.Item>
        <Button onClick={addPricing}>Add tier</Button>
      </Form>

      <Divider />

      <h3 className="mb-3 font-display text-lg font-semibold">Deliverables</h3>
      <Table
        rowKey="id"
        dataSource={assets}
        pagination={false}
        size="small"
        columns={[
          { title: 'File', dataIndex: 'fileName' },
          { title: 'Type', dataIndex: 'type', render: (t: string) => <Tag>{t}</Tag> },
          {
            title: 'Size',
            dataIndex: 'sizeBytes',
            render: (b: number) => (b ? `${(b / 1024 / 1024).toFixed(1)} MB` : '—'),
          },
          {
            title: '',
            render: (_, r) => (
              <Popconfirm title="Remove this deliverable?" onConfirm={() => deleteAsset(r.id)}>
                <Button size="small" danger>
                  Remove
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
      <Upload beforeUpload={beforeUpload} showUploadList={false} multiple>
        <Button className="mt-4" icon={<UploadOutlined />} loading={uploading}>
          Upload deliverable
        </Button>
      </Upload>
      <p className="mt-2 text-xs text-ink-muted">
        Uploaded to private storage; buyers receive short-lived signed download links after
        purchase.
      </p>
    </Drawer>
  );
}
