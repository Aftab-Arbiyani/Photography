import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  MAIL_QUEUE,
  MEDIA_QUEUE,
  MailJob,
  MediaJob,
  type DigestJob,
  type InvisibleWatermarkJob,
} from './queue.constants';

/** Thin producer API so the rest of the app enqueues jobs without touching BullMQ directly. */
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(MEDIA_QUEUE) private readonly mediaQueue: Queue,
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
  ) {}

  enqueueInvisibleWatermark(data: InvisibleWatermarkJob) {
    return this.mediaQueue.add(MediaJob.INVISIBLE_WATERMARK, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }

  enqueueDigest(data: DigestJob) {
    return this.mailQueue.add(MailJob.DIGEST, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}
