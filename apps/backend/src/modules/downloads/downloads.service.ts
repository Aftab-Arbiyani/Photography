import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { type Paginated, type PublicEntitlement, type SignedDownload } from '@photography/types';
import { normalizePagination, paginate } from '@photography/utils';
import type { CommerceConfig } from '../../config/configuration';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { StorageService } from '../../storage/storage.service';
import { WatermarkService } from '../../storage/watermark.service';
import { AlbumAsset } from '../albums/entities/album-asset.entity';
import { Entitlement } from '../orders/entities/entitlement.entity';
import { toPublicEntitlement } from '../orders/order.mapper';
import { toPublicAsset } from '../marketplace/marketplace-album.mapper';
import { User } from '../users/entities/user.entity';
import { Download } from './entities/download.entity';

export interface DownloadContext {
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprint?: string | null;
}

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);
  private readonly commerce: CommerceConfig;

  constructor(
    @InjectRepository(Entitlement) private readonly entitlementRepository: Repository<Entitlement>,
    @InjectRepository(AlbumAsset) private readonly assetRepository: Repository<AlbumAsset>,
    @InjectRepository(Download) private readonly downloadRepository: Repository<Download>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly storage: StorageService,
    private readonly watermark: WatermarkService,
    configService: ConfigService,
  ) {
    this.commerce = configService.getOrThrow<CommerceConfig>('commerce');
  }

  /** My purchased albums with their deliverable assets and remaining downloads. */
  async listMyEntitlements(userId: string): Promise<PublicEntitlement[]> {
    const entitlements = await this.entitlementRepository.find({
      where: { userId, isActive: true },
      relations: { album: true },
      order: { createdAt: 'DESC' },
    });
    if (entitlements.length === 0) return [];

    const albumIds = [...new Set(entitlements.map((e) => e.albumId))];
    const assets = await this.assetRepository.find({ where: { albumId: In(albumIds) } });
    const assetsByAlbum = new Map<string, AlbumAsset[]>();
    for (const a of assets) {
      const list = assetsByAlbum.get(a.albumId) ?? [];
      list.push(a);
      assetsByAlbum.set(a.albumId, list);
    }

    return entitlements.map((e) =>
      toPublicEntitlement(
        e,
        (assetsByAlbum.get(e.albumId) ?? [])
          // Hide RAW deliverables from licenses that don't include them.
          .filter((a) => !a.requiresRaw || e.includesRaw)
          .map(toPublicAsset),
      ),
    );
  }

  /**
   * Issue a signed download for a purchased asset. Enforces purchase, RAW license,
   * download limit (atomic) and expiry; watermarks images with the buyer's email;
   * records a full audit row (IP / UA / device).
   */
  async requestDownload(
    userId: string,
    assetId: string,
    ctx: DownloadContext,
  ): Promise<SignedDownload> {
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const entitlement = await this.entitlementRepository.findOne({
      where: { userId, albumId: asset.albumId, isActive: true },
    });
    if (!entitlement) {
      throw new ForbiddenException('You have not purchased this album');
    }
    if (asset.requiresRaw && !entitlement.includesRaw) {
      throw new ForbiddenException('RAW files are not included in your license');
    }

    // Atomic limit + expiry enforcement: only succeeds while quota remains.
    const result = await this.entitlementRepository
      .createQueryBuilder()
      .update(Entitlement)
      .set({ downloadsUsed: () => 'downloads_used + 1' })
      .where('id = :id', { id: entitlement.id })
      .andWhere('is_active = true')
      .andWhere('downloads_used < download_limit')
      .andWhere('(expires_at IS NULL OR expires_at > now())')
      .execute();
    if (!result.affected) {
      throw new ForbiddenException('Download limit reached or your access has expired');
    }

    let key = asset.storageKey;
    let watermarked = false;
    if (this.commerce.watermarkEnabled && asset.watermarkable) {
      try {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const original = await this.storage.getObject(asset.storageKey);
        const stamped = await this.watermark.applyBuyerWatermark(original, user?.email ?? userId);
        // Embed an invisible forensic trace (buyer id + entitlement + timestamp)
        // so a leaked file can be traced back even if the visible stamp is cropped.
        const traced = await this.watermark.applyInvisibleWatermark(
          stamped,
          `u:${userId}|e:${entitlement.id}|t:${Date.now()}`,
        );
        key = `tmp/watermarked/${randomUUID()}-${asset.fileName}`;
        await this.storage.upload(key, traced, asset.contentType);
        watermarked = true;
      } catch (error) {
        this.logger.warn(`Watermark step skipped: ${(error as Error).message}`);
        key = asset.storageKey;
      }
    }

    const ttl = this.commerce.signedUrlTtlSeconds;
    const url = await this.storage.getSignedDownloadUrl(key, ttl, asset.fileName);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await this.downloadRepository.insert({
      entitlementId: entitlement.id,
      userId,
      assetId: asset.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent?.slice(0, 512) ?? null,
      deviceFingerprint: ctx.deviceFingerprint ?? null,
      signedUrlExpiresAt: expiresAt,
      watermarked,
    });

    return {
      url,
      fileName: asset.fileName,
      expiresAt: expiresAt.toISOString(),
      downloadsRemaining: Math.max(0, entitlement.downloadLimit - (entitlement.downloadsUsed + 1)),
    };
  }

  /** Download audit history for the current user. */
  async history(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [rows, total] = await this.downloadRepository.findAndCount({
      where: { userId },
      relations: { asset: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    const items = rows.map((d) => ({
      id: d.id,
      assetId: d.assetId,
      fileName: d.asset?.fileName ?? null,
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
      watermarked: d.watermarked,
      createdAt: d.createdAt.toISOString(),
    }));
    return paginate(items, total, page, limit);
  }
}
