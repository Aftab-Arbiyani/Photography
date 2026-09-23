'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { UserRole } from '@photography/types';
import { client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [bookmarks, setBookmarks] = useState<number | null>(null);
  const [orders, setOrders] = useState<number | null>(null);

  useEffect(() => {
    client
      .unreadCount()
      .then((r) => setUnread(r.count))
      .catch(() => undefined);
    client
      .myBookmarks(1)
      .then((r) => setBookmarks(r.meta.totalItems))
      .catch(() => undefined);
    client
      .myOrders(1)
      .then((r) => setOrders(r.meta.totalItems))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="mt-2 text-ink-muted">Manage your account, library and activity.</p>

      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Unread notifications" value={unread} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Bookmarks" value={bookmarks ?? '—'} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Orders" value={orders ?? '—'} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Role"
              valueRender={() => <span className="capitalize">{user?.role}</span>}
            />
          </Card>
        </Col>
      </Row>

      {user?.role === UserRole.USER && (
        <Card className="mt-6">
          <h2 className="font-display text-tagline font-semibold">Sell your work</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Apply to become a photographer to upload and sell albums on Aperture.
          </p>
          <Link
            href="/dashboard/photographer"
            className="mt-4 inline-block rounded-pill bg-primary px-5 py-2 text-sm text-white transition active:scale-95"
          >
            Become a photographer
          </Link>
        </Card>
      )}
    </div>
  );
}
