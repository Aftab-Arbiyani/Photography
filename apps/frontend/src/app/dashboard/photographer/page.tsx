'use client';

import { useEffect, useState } from 'react';
import { App, Button, Card, Col, Form, Input, Row, Spin, Statistic, Tag } from 'antd';
import {
  ApplicationStatus,
  type PhotographerDashboard,
  type PublicPhotographerApplication,
  UserRole,
} from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { features } from '@/lib/config';

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  );

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: 'gold',
  [ApplicationStatus.UNDER_REVIEW]: 'blue',
  [ApplicationStatus.APPROVED]: 'green',
  [ApplicationStatus.REJECTED]: 'red',
};

export default function PhotographerPage() {
  const { user } = useAuth();
  const isPhotographer =
    user && (user.role === UserRole.PHOTOGRAPHER || user.role === UserRole.ADMIN);

  if (isPhotographer) return <EarningsDashboard />;
  if (!features.photographerApplications) {
    return (
      <Card>
        <h1 className="font-display text-tagline font-semibold">Not available</h1>
        <p className="mt-2 text-sm text-ink-muted">Uploading is limited to administrators.</p>
      </Card>
    );
  }
  return <ApplicationFlow />;
}

function EarningsDashboard() {
  const [data, setData] = useState<PhotographerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .photographerDashboard()
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spin />
      </div>
    );
  if (!data) return <p className="text-ink-muted">No photographer profile found.</p>;

  const { earnings: e, profile } = data;
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-display-lg font-semibold tracking-tight">Photographer</h1>
        {profile.isVerified && <Tag color="green">Verified</Tag>}
      </div>
      <p className="mt-2 mb-6 text-ink-muted">Earnings, audience and content at a glance.</p>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Available balance" value={money(e.availableCents, e.currency)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Net earned" value={money(e.netCents, e.currency)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Gross sales" value={money(e.grossCents, e.currency)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Sales" value={e.salesCount} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Photos" value={data.photosCount} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Albums" value={data.albumsCount} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Followers" value={data.followersCount} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Commission" value={`${Math.round(profile.commissionRate * 100)}%`} />
          </Card>
        </Col>
      </Row>

      {data.topPhotos.length > 0 && (
        <Card className="mt-6" title="Top photos by views">
          <ul className="space-y-2">
            {data.topPhotos.map((p) => (
              <li key={p.id} className="flex justify-between text-sm">
                <span className="truncate">{p.title}</span>
                <span className="text-ink-muted">{p.views} views</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function ApplicationFlow() {
  const { message } = App.useApp();
  const [application, setApplication] = useState<PublicPhotographerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client
      .myApplication()
      .then(setApplication)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const apply = async (values: { statement: string; portfolioUrl?: string }) => {
    setSubmitting(true);
    try {
      const app = await client.applyPhotographer(values.statement, values.portfolioUrl);
      setApplication(app);
      message.success('Application submitted');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spin />
      </div>
    );

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-display-lg font-semibold tracking-tight">
        Become a photographer
      </h1>
      <p className="mt-2 mb-6 text-ink-muted">Apply to upload and sell your work on Aperture.</p>

      {application && application.status !== ApplicationStatus.REJECTED ? (
        <Card>
          <p className="mb-2">
            Application status:{' '}
            <Tag color={STATUS_COLOR[application.status]}>{application.status}</Tag>
          </p>
          {application.reviewNote && (
            <p className="text-sm text-ink-muted">Note: {application.reviewNote}</p>
          )}
          <p className="mt-2 text-sm text-ink-muted">We’ll notify you once it’s reviewed.</p>
        </Card>
      ) : (
        <Card>
          {application?.status === ApplicationStatus.REJECTED && (
            <p className="mb-4 text-sm text-ink-muted">
              Your previous application was not approved
              {application.reviewNote ? `: ${application.reviewNote}` : ''}. You may apply again.
            </p>
          )}
          <Form layout="vertical" onFinish={apply} requiredMark={false}>
            <Form.Item
              name="statement"
              label="Why do you want to sell on Aperture?"
              rules={[{ required: true, max: 2000 }]}
            >
              <Input.TextArea rows={4} maxLength={2000} showCount />
            </Form.Item>
            <Form.Item
              name="portfolioUrl"
              label="Portfolio URL"
              rules={[{ type: 'url', message: 'Enter a valid URL' }]}
            >
              <Input size="large" placeholder="https://…" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Submit application
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
}
