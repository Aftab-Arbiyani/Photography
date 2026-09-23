'use client';

import { useState } from 'react';
import { App, Button, Dropdown, Form, Input, Modal, Select } from 'antd';
import { FlagOutlined, ShareAltOutlined } from '@ant-design/icons';
import { ReportReason, ReportTargetType, ShareChannel, ShareTargetType } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

const REASONS = [
  { value: ReportReason.SPAM, label: 'Spam' },
  { value: ReportReason.ABUSE, label: 'Abuse' },
  { value: ReportReason.COPYRIGHT, label: 'Copyright' },
  { value: ReportReason.NUDITY, label: 'Nudity' },
  { value: ReportReason.HATE, label: 'Hate' },
  { value: ReportReason.OTHER, label: 'Other' },
];

/** Share (multi-channel) + Report controls for a photo. */
export function PhotoSocial({ photoId, photoSlug }: { photoId: string; photoSlug: string }) {
  const { isAuthenticated } = useAuth();
  const { message } = App.useApp();
  const [reportOpen, setReportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const doShare = async (channel: ShareChannel) => {
    try {
      const res = await client.share(ShareTargetType.PHOTO, photoId, channel);
      if (channel === ShareChannel.LINK) {
        await navigator.clipboard.writeText(res.shareUrl).catch(() => undefined);
        message.success('Link copied');
      } else {
        window.open(shareIntent(channel, res.shareUrl), '_blank', 'noopener');
      }
    } catch {
      // sharing is best-effort; still copy a local URL
      await navigator.clipboard
        .writeText(`${window.location.origin}/photos/${photoSlug}`)
        .catch(() => undefined);
      message.success('Link copied');
    }
  };

  const submitReport = async (values: { reason: ReportReason; details?: string }) => {
    setSubmitting(true);
    try {
      await client.report(ReportTargetType.PHOTO, photoId, values.reason, values.details);
      message.success('Report submitted — thank you');
      setReportOpen(false);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            { key: ShareChannel.LINK, label: 'Copy link' },
            { key: ShareChannel.TWITTER, label: 'Twitter / X' },
            { key: ShareChannel.FACEBOOK, label: 'Facebook' },
            { key: ShareChannel.PINTEREST, label: 'Pinterest' },
          ],
          onClick: ({ key }) => doShare(key as ShareChannel),
        }}
      >
        <Button icon={<ShareAltOutlined />}>Share</Button>
      </Dropdown>

      <Button
        icon={<FlagOutlined />}
        onClick={() => (isAuthenticated ? setReportOpen(true) : message.info('Sign in to report'))}
      >
        Report
      </Button>

      <Modal
        title="Report this photo"
        open={reportOpen}
        onCancel={() => setReportOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={submitReport} requiredMark={false}>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Choose a reason' }]}
          >
            <Select options={REASONS} placeholder="Select…" />
          </Form.Item>
          <Form.Item name="details" label="Details (optional)">
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Submit report
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

function shareIntent(channel: ShareChannel, url: string): string {
  const u = encodeURIComponent(url);
  switch (channel) {
    case ShareChannel.TWITTER:
      return `https://twitter.com/intent/tweet?url=${u}`;
    case ShareChannel.FACEBOOK:
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case ShareChannel.PINTEREST:
      return `https://pinterest.com/pin/create/button/?url=${u}`;
    default:
      return url;
  }
}
