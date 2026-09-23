'use client';

import { useEffect, useState } from 'react';
import { Card, Col, List, Row, Spin, Statistic } from 'antd';
import type { AnalyticsDashboard } from '@photography/types';
import { client } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';

export default function AdminOverviewPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.admin
      .analytics()
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  if (!data) return <p className="text-ink-muted">No analytics available.</p>;

  return (
    <div>
      <h1 className="font-display text-display-lg font-semibold tracking-tight">Overview</h1>
      <p className="mt-2 mb-6 text-ink-muted">
        {new Date(data.range.from).toLocaleDateString()} –{' '}
        {new Date(data.range.to).toLocaleDateString()}
      </p>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Visitors" value={data.visitors} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Returning" value={data.returningUsers} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Pageviews" value={data.pageviews} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Conversion" value={`${(data.conversionRate * 100).toFixed(1)}%`} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Sales" value={data.sales.count} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={formatMoney(data.sales.revenueCents, data.sales.currency)}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Downloads" value={data.downloads} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} md={8}>
          <Card title="Top searches">
            <List
              size="small"
              dataSource={data.topSearches}
              locale={{ emptyText: 'No searches yet' }}
              renderItem={(s) => (
                <List.Item>
                  <span className="truncate">{s.label}</span>
                  <span className="text-ink-muted">{s.value}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Popular photos">
            <List
              size="small"
              dataSource={data.popularPhotos}
              locale={{ emptyText: 'No data' }}
              renderItem={(p) => (
                <List.Item>
                  <span className="truncate">{p.label}</span>
                  <span className="text-ink-muted">{p.value} views</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Popular albums">
            <List
              size="small"
              dataSource={data.popularAlbums}
              locale={{ emptyText: 'No data' }}
              renderItem={(a) => (
                <List.Item>
                  <span className="truncate">{a.label}</span>
                  <span className="text-ink-muted">{a.value} sales</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Revenue (daily)" className="mt-6">
        {data.revenueGraph.length === 0 ? (
          <p className="text-sm text-ink-muted">No revenue in range.</p>
        ) : (
          <RevenueBars points={data.revenueGraph} currency={data.sales.currency} />
        )}
      </Card>
    </div>
  );
}

/** Lightweight inline bar chart (no chart lib needed for this slice). */
function RevenueBars({
  points,
  currency,
}: {
  points: { date: string; value: number }[];
  currency: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <div className="flex h-40 items-end gap-1 overflow-x-auto">
      {points.map((p) => (
        <div
          key={p.date}
          className="flex min-w-[14px] flex-1 flex-col items-center justify-end"
          title={`${p.date}: ${formatMoney(p.value, currency)}`}
        >
          <div
            className="w-full rounded-t bg-primary/80"
            style={{ height: `${(p.value / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
