'use client';

import { useEffect, useState } from 'react';
import { App, Button, Card, Empty, Spin, Tag } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { PublicEntitlement } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';

export default function DownloadsPage() {
  const { message } = App.useApp();
  const [entitlements, setEntitlements] = useState<PublicEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    client
      .downloadsLibrary()
      .then(setEntitlements)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const download = async (assetId: string) => {
    setBusy(assetId);
    try {
      const signed = await client.requestDownload(assetId);
      window.open(signed.url, '_blank', 'noopener');
      message.success(`Download started — ${signed.downloadsRemaining} left`);
      // refresh remaining counts
      setEntitlements(await client.downloadsLibrary());
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Download failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Downloads</h1>
      <p className="mt-2 mb-6 text-ink-muted">Your purchased albums and deliverables.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : entitlements.length === 0 ? (
        <Empty description="Nothing purchased yet" className="py-16" />
      ) : (
        <div className="space-y-4">
          {entitlements.map((e) => (
            <Card key={e.id} title={e.albumTitle}>
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <Tag>{e.licenseType}</Tag>
                <Tag color={e.downloadsRemaining > 0 ? 'green' : 'red'}>
                  {e.downloadsRemaining}/{e.downloadLimit} downloads left
                </Tag>
                {e.expiresAt && <Tag>Expires {new Date(e.expiresAt).toLocaleDateString()}</Tag>}
                {!e.isActive && <Tag color="red">Inactive</Tag>}
              </div>
              {e.assets.length === 0 ? (
                <p className="text-sm text-ink-muted">No downloadable files attached yet.</p>
              ) : (
                <ul className="space-y-2">
                  {e.assets.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm">
                        {a.fileName} <span className="text-ink-muted">({a.type})</span>
                      </span>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        loading={busy === a.id}
                        disabled={!e.isActive || e.downloadsRemaining <= 0}
                        onClick={() => download(a.id)}
                      >
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
