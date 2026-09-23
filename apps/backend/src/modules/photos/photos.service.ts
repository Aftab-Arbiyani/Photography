import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Brackets, In, Repository } from 'typeorm';
import {
  ContentStatus,
  type CursorPaginated,
  type Paginated,
  type PublicPhoto,
  UserRole,
} from '@photography/types';
import {
  aspectRatio,
  decodeCursor,
  encodeCursor,
  normalizePagination,
  paginate,
  slugify,
  uniqueSlug,
} from '@photography/utils';
import type { RequestUser } from '../../common/types/authenticated-request';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ImageProcessingService } from '../../storage/image-processing.service';
import { StorageService } from '../../storage/storage.service';
import { Bookmark } from './entities/bookmark.entity';
import { Like } from './entities/like.entity';
import { Photo } from './entities/photo.entity';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { QueryPhotosDto } from './dto/query-photos.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { type PhotoViewerContext, toPublicPhoto } from './photo.mapper';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Like) private readonly likeRepository: Repository<Like>,
    @InjectRepository(Bookmark) private readonly bookmarkRepository: Repository<Bookmark>,
    private readonly storage: StorageService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  // ---------- upload ----------

  async upload(
    file: Express.Multer.File,
    dto: CreatePhotoDto,
    user: RequestUser,
  ): Promise<PublicPhoto> {
    const processed = await this.imageProcessing.process(file.buffer);

    const folder = `photos/${randomUUID()}`;
    const originalExt = extname(file.originalname).replace('.', '') || 'jpg';

    // Upload original + every derivative in parallel.
    const [original, thumb, webp, avif] = await Promise.all([
      this.storage.upload(`${folder}/original.${originalExt}`, file.buffer, file.mimetype),
      ...processed.variants.map((v) =>
        this.storage.upload(`${folder}/${v.variant}.${v.extension}`, v.buffer, v.contentType),
      ),
    ]);

    const status = dto.status ?? ContentStatus.DRAFT;
    const photo = this.photoRepository.create({
      title: dto.title,
      slug: await this.generateSlug(dto.title),
      description: dto.description ?? null,
      story: dto.story ?? null,
      status,
      width: processed.width,
      height: processed.height,
      aspectRatio: aspectRatio(processed.width, processed.height),
      storageKey: original.key,
      thumbnailKey: thumb.key,
      webpKey: webp.key,
      avifKey: avif.key,
      blurDataUrl: processed.blurDataUrl,
      // normalized EXIF
      cameraMake: processed.exif?.cameraMake ?? null,
      cameraModel: processed.exif?.cameraModel ?? null,
      lensModel: processed.exif?.lensModel ?? null,
      iso: processed.exif?.iso ?? null,
      shutterSpeed: processed.exif?.shutterSpeed ?? null,
      aperture: processed.exif?.aperture ?? null,
      focalLength: processed.exif?.focalLength ?? null,
      takenAt: processed.exif?.takenAt ? new Date(processed.exif.takenAt) : null,
      gpsLatitude: processed.exif?.gpsLatitude ?? null,
      gpsLongitude: processed.exif?.gpsLongitude ?? null,
      exifRaw: processed.exif?.raw ?? null,
      isFeatured: dto.isFeatured ?? false,
      categoryId: dto.categoryId ?? null,
      albumId: dto.albumId ?? null,
      photographerId: user.id,
      publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
    });

    const saved = await this.photoRepository.save(photo);
    return toPublicPhoto(saved, this.storage);
  }

  private async generateSlug(title: string): Promise<string> {
    const base = slugify(title);
    const exists = await this.photoRepository.findOne({ where: { slug: base }, withDeleted: true });
    return exists ? uniqueSlug(base) : base;
  }

  // ---------- gallery (cursor / keyset pagination) ----------

  async findGallery(
    query: QueryPhotosDto,
    viewerId?: string,
  ): Promise<CursorPaginated<PublicPhoto>> {
    const limit = query.limit;
    const qb = this.photoRepository
      .createQueryBuilder('photo')
      .where('photo.status = :status', { status: ContentStatus.PUBLISHED });

    if (query.categoryId)
      qb.andWhere('photo.category_id = :categoryId', { categoryId: query.categoryId });
    if (query.albumId) qb.andWhere('photo.album_id = :albumId', { albumId: query.albumId });
    if (query.photographerId)
      qb.andWhere('photo.photographer_id = :photographerId', {
        photographerId: query.photographerId,
      });
    if (query.featured === 'true') qb.andWhere('photo.is_featured = true');
    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('photo.title ILIKE :s', { s: `%${query.search}%` }).orWhere(
            'photo.description ILIKE :s',
            { s: `%${query.search}%` },
          );
        }),
      );
    }

    // Keyset on (published_at, id) DESC for stable infinite scroll.
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    if (cursor) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('photo.published_at < :cv', { cv: cursor.value }).orWhere(
            new Brackets((w2) => {
              w2.where('photo.published_at = :cv', { cv: cursor.value }).andWhere(
                'photo.id < :cid',
                {
                  cid: cursor.id,
                },
              );
            }),
          );
        }),
      );
    }

    qb.orderBy('photo.published_at', 'DESC')
      .addOrderBy('photo.id', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const ctx = await this.viewerContext(items, viewerId);
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last?.publishedAt
        ? encodeCursor({ value: last.publishedAt.toISOString(), id: last.id })
        : null;

    return {
      items: items.map((p) => toPublicPhoto(p, this.storage, ctx)),
      nextCursor,
      hasMore,
    };
  }

  // ---------- single photo ----------

  async findBySlug(slug: string, viewerId?: string): Promise<PublicPhoto> {
    const photo = await this.photoRepository.findOne({ where: { slug } });
    if (!photo || photo.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Photo not found');
    }
    // Fire-and-forget view increment (atomic).
    void this.photoRepository.increment({ id: photo.id }, 'viewsCount', 1);

    const ctx = await this.viewerContext([photo], viewerId);
    return toPublicPhoto(photo, this.storage, ctx);
  }

  async findRelated(slug: string, limit = 8): Promise<PublicPhoto[]> {
    const photo = await this.photoRepository.findOne({ where: { slug } });
    if (!photo) throw new NotFoundException('Photo not found');

    const qb = this.photoRepository
      .createQueryBuilder('photo')
      .where('photo.status = :status', { status: ContentStatus.PUBLISHED })
      .andWhere('photo.id != :id', { id: photo.id });

    if (photo.categoryId) {
      qb.andWhere('photo.category_id = :categoryId', { categoryId: photo.categoryId });
    } else if (photo.albumId) {
      qb.andWhere('photo.album_id = :albumId', { albumId: photo.albumId });
    } else {
      qb.andWhere('photo.photographer_id = :pid', { pid: photo.photographerId });
    }

    const rows = await qb.orderBy('photo.published_at', 'DESC').take(limit).getMany();
    return rows.map((p) => toPublicPhoto(p, this.storage));
  }

  /** The current user's bookmarked photos (newest bookmark first). */
  async listMyBookmarks(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<PublicPhoto>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const qb = this.photoRepository
      .createQueryBuilder('photo')
      .innerJoin('bookmarks', 'b', 'b.photo_id = photo.id AND b.user_id = :userId', { userId })
      .where('photo.status = :status', { status: ContentStatus.PUBLISHED })
      .orderBy('b.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [photos, total] = await qb.getManyAndCount();
    const ctx = await this.viewerContext(photos, userId);
    return paginate(
      photos.map((p) => toPublicPhoto(p, this.storage, ctx)),
      total,
      page,
      limit,
    );
  }

  // ---------- management (owner / admin) ----------

  async getEntity(id: string): Promise<Photo> {
    const photo = await this.photoRepository.findOne({ where: { id } });
    if (!photo) throw new NotFoundException('Photo not found');
    return photo;
  }

  private assertCanManage(photo: Photo, user: RequestUser): void {
    if (user.role !== UserRole.ADMIN && photo.photographerId !== user.id) {
      throw new ForbiddenException('You do not own this photo');
    }
  }

  async update(id: string, dto: UpdatePhotoDto, user: RequestUser): Promise<PublicPhoto> {
    const photo = await this.getEntity(id);
    this.assertCanManage(photo, user);
    if (dto.status === ContentStatus.PUBLISHED && !photo.publishedAt) {
      photo.publishedAt = new Date();
    }
    Object.assign(photo, dto);
    return toPublicPhoto(await this.photoRepository.save(photo), this.storage);
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const photo = await this.getEntity(id);
    this.assertCanManage(photo, user);
    // Soft-delete the row; storage objects are pruned by a later cleanup job.
    await this.photoRepository.softRemove(photo);
  }

  // ---------- viewer annotation ----------

  /** Batch-loads which of the given photos the viewer has liked/bookmarked. */
  private async viewerContext(photos: Photo[], viewerId?: string): Promise<PhotoViewerContext> {
    if (!viewerId || photos.length === 0) return {};
    const ids = photos.map((p) => p.id);
    const [likes, bookmarks] = await Promise.all([
      this.likeRepository.find({
        where: { userId: viewerId, photoId: In(ids) },
        select: { photoId: true },
      }),
      this.bookmarkRepository.find({
        where: { userId: viewerId, photoId: In(ids) },
        select: { photoId: true },
      }),
    ]);
    return {
      likedPhotoIds: new Set(likes.map((l) => l.photoId)),
      bookmarkedPhotoIds: new Set(bookmarks.map((b) => b.photoId)),
    };
  }
}
