'use client';

import { useEffect, useState } from 'react';
import { App, Button, Empty, List, Spin, Tag } from 'antd';
import type { PublicNotification } from '@photography/types';
import { client } from '@/lib/api-client';

export default function NotificationsPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<PublicNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    client
      .notifications(1)
      .then((r) => setItems(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const markAll = async () => {
    await client.markAllRead().catch(() => undefined);
    message.success('All marked read');
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Notifications</h1>
        <Button onClick={markAll} disabled={!items.some((n) => !n.readAt)}>
          Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <Empty description="No notifications" className="py-16" />
      ) : (
        <List
          className="mt-6"
          dataSource={items}
          renderItem={(n) => (
            <List.Item
              actions={
                n.readAt
                  ? []
                  : [
                      <Tag color="blue" key="new">
                        New
                      </Tag>,
                    ]
              }
              onClick={() =>
                !n.readAt &&
                client
                  .markNotificationRead(n.id)
                  .then(load)
                  .catch(() => undefined)
              }
            >
              <List.Item.Meta
                title={n.title}
                description={
                  <span className="text-ink-muted">
                    {n.body} · {new Date(n.createdAt).toLocaleString()}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
