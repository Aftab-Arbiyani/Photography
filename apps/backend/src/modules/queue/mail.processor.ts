import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { MailService } from '../../mail/mail.service';
import { MAIL_QUEUE, MailJob, type DigestJob } from './queue.constants';

/** Sends transactional/digest emails off the request path. */
@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case MailJob.DIGEST: {
        const data = job.data as DigestJob;
        await this.mail.sendDigestEmail(data.to, data.name, data.unreadCount);
        return { sent: true };
      }
      default:
        this.logger.warn(`Unknown mail job: ${job.name}`);
        return null;
    }
  }
}
