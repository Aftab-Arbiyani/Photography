'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Badge, Dropdown, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import type { PublicNotification } from '@photography/types';
import { client } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';
import { siteConfig } from '@/lib/config';

/**
 * Notification bell: shows an unread badge, lists recent notifications, and
 * subscribes to the realtime SSE stream (Redis-backed) for live updates.
 */
export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<PublicNotification[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const refresh = () => {
    client
      .unreadCount()
      .then((r) => setUnread(r.count))
      .catch(() => undefined);
    client
      .notifications(1)
      .then((r) => setItems(r.items.slice(0, 8)))
      .catch(() => undefined);
  };

  useEffect(() => {
    refresh();
    // Realtime stream — token passed via query (EventSource can't set headers).
    const token = authStorage.getAccessToken();
    if (!token) return;
    const es = new EventSource(
      `${siteConfig.apiUrl}/notifications/stream?token=${encodeURIComponent(token)}`,
    );
    esRef.current = es;
    es.onmessage = (evt) => {
      try {
        // The stream also emits `{ type: 'ping' }` keep-alive frames.
        const data = JSON.parse(evt.data) as PublicNotification | { type: 'ping' };
        if (data?.type === 'ping') return;
        // Dedupe by id so a pushed notification also present from refresh() isn't doubled.
        setItems((prev) => [data, ...prev.filter((p) => p.id !== data.id)].slice(0, 8));
        setUnread((n) => n + 1);
      } catch {
        /* ignore malformed frames */
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  const markAll = async () => {
    await client.markAllRead().catch(() => undefined);
    setUnread(0);
    refresh();
  };

  return (
    <Dropdown
      trigger={['click']}
      onOpenChange={(open) => open && refresh()}
      popupRender={() => (
        <div className="w-80 rounded-card border border-hairline/60 bg-canvas p-3 shadow-lg dark:border-white/10 dark:bg-tile-1">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs text-primary">
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No notifications"
              className="py-4"
            />
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n, i) => (
                <li
                  key={n.id ?? `${n.createdAt ?? 'live'}-${i}`}
                  className={`rounded-md px-2 py-2 text-sm ${n.readAt ? '' : 'bg-parchment dark:bg-tile-2'}`}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-ink-muted">{n.body}</p>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/notifications" className="mt-2 block px-1 text-xs text-primary">
            View all
          </Link>
        </div>
      )}
    >
      <button
        type="button"
        aria-label="Notifications"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink/80 transition hover:bg-ink/5 dark:text-parchment/80 dark:hover:bg-white/10"
      >
        <Badge count={unread} size="small">
          <BellOutlined />
        </Badge>
      </button>
    </Dropdown>
  );
}
