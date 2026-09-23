import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareChannel, type ShareResult, ShareTargetType } from '@photography/types';
import type { AppConfig } from '../../config/configuration';
import { Album } from '../albums/entities/album.entity';
import { Collection } from '../collections/entities/collection.entity';
import { Photo } from '../photos/entities/photo.entity';
import { ShareEvent } from './entities/share-event.entity';

const PATH_BY_TYPE: Record<ShareTargetType, string> = {
  [ShareTargetType.PHOTO]: 'photos',
  [ShareTargetType.ALBUM]: 'albums',
  [ShareTargetType.COLLECTION]: 'collections',
};

@Injectable()
export class SharingService {
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(ShareEvent) private readonly shareRepository: Repository<ShareEvent>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(Collection) private readonly collectionRepository: Repository<Collection>,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.getOrThrow<AppConfig>('app').frontendUrl;
  }

  /** Resolve the public slug for the target (and verify it exists). */
  private async resolveSlug(type: ShareTargetType, id: string): Promise<string> {
    const repo =
      type === ShareTargetType.PHOTO
        ? this.photoRepository
        : type === ShareTargetType.ALBUM
          ? this.albumRepository
          : this.collectionRepository;
    const row = await repo.findOne({ where: { id }, select: { slug: true } as never });
    if (!row) throw new NotFoundException('Shared item not found');
    return (row as { slug: string }).slug;
  }

  async share(
    targetType: ShareTargetType,
    targetId: string,
    channel: ShareChannel,
    userId: string | null,
    ip: string | null,
  ): Promise<ShareResult> {
    const slug = await this.resolveSlug(targetType, targetId);
    await this.shareRepository.insert({ targetType, targetId, channel, userId, ipAddress: ip });

    let sharesCount: number;
    if (targetType === ShareTargetType.PHOTO) {
      await this.photoRepository.increment({ id: targetId }, 'sharesCount', 1);
      const photo = await this.photoRepository.findOneByOrFail({ id: targetId });
      sharesCount = photo.sharesCount;
    } else {
      sharesCount = await this.shareRepository.count({ where: { targetType, targetId } });
    }

    return {
      targetType,
      targetId,
      channel,
      shareUrl: `${this.frontendUrl}/${PATH_BY_TYPE[targetType]}/${slug}`,
      sharesCount,
    };
  }
}
