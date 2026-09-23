import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { StorageService } from '../../storage/storage.service';
import { WatermarkService } from '../../storage/watermark.service';
import { MEDIA_QUEUE, MediaJob, type InvisibleWatermarkJob } from './queue.constants';

/**
 * Offloads heavy media work (sharp/steganography) from the request path.
 * Runs on worker instances; the API just enqueues jobs.
 */
@Processor(MEDIA_QUEUE)
export class MediaProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    private readonly storage: StorageService,
    private readonly watermark: WatermarkService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case MediaJob.INVISIBLE_WATERMARK:
        return this.embedWatermark(job.data as InvisibleWatermarkJob);
      default:
        this.logger.warn(`Unknown media job: ${job.name}`);
        return null;
    }
  }

  private async embedWatermark(data: InvisibleWatermarkJob): Promise<{ destKey: string }> {
    const original = await this.storage.getObject(data.sourceKey);
    const stamped = await this.watermark.applyInvisibleWatermark(original, data.payload);
    await this.storage.upload(data.destKey, stamped, data.contentType);
    this.logger.log(`Embedded invisible watermark → ${data.destKey}`);
    return { destKey: data.destKey };
  }
}
