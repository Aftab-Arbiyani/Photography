/** BullMQ queue names + job names. Centralized so producers/consumers can't drift. */
export const MEDIA_QUEUE = 'media';
export const MAIL_QUEUE = 'mail';

export const MediaJob = {
  INVISIBLE_WATERMARK: 'invisible-watermark',
} as const;

export const MailJob = {
  DIGEST: 'digest',
} as const;

export interface InvisibleWatermarkJob {
  sourceKey: string;
  destKey: string;
  contentType: string;
  payload: string;
}

export interface DigestJob {
  to: string;
  name: string;
  unreadCount: number;
}
