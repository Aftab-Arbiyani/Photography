import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReviewStatus, type Paginated, type PublicReview, UserRole } from '@photography/types';
import { displayName, normalizePagination, paginate } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { Album } from '../albums/entities/album.entity';
import { Entitlement } from '../orders/entities/entitlement.entity';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Entitlement) private readonly entitlementRepository: Repository<Entitlement>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    private readonly dataSource: DataSource,
  ) {}

  private toPublic(r: Review): PublicReview {
    return {
      id: r.id,
      albumId: r.albumId,
      authorId: r.userId,
      authorDisplayName: r.user
        ? displayName(r.user.firstName, r.user.lastName, r.user.email)
        : 'Anonymous',
      authorAvatarUrl: r.user?.avatarUrl ?? null,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private hasPurchased(userId: string, albumId: string): Promise<boolean> {
    return this.entitlementRepository
      .count({ where: { userId, albumId, isActive: true } })
      .then((n) => n > 0);
  }

  /** Recompute the album's denormalized rating aggregates inside a transaction. */
  private async recomputeAlbumRating(albumId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const raw = await manager
        .getRepository(Review)
        .createQueryBuilder('r')
        .select('COALESCE(AVG(r.rating), 0)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('r.album_id = :albumId', { albumId })
        .andWhere('r.status = :status', { status: ReviewStatus.PUBLISHED })
        .andWhere('r.deleted_at IS NULL')
        .getRawOne<{ avg: string; count: string }>();
      await manager.update(
        Album,
        { id: albumId },
        {
          ratingAverage: Math.round(parseFloat(raw?.avg ?? '0') * 100) / 100,
          ratingCount: parseInt(raw?.count ?? '0', 10),
        },
      );
    });
  }

  async createOrUpdate(
    albumId: string,
    user: RequestUser,
    dto: CreateReviewDto,
  ): Promise<PublicReview> {
    const album = await this.albumRepository.findOne({ where: { id: albumId } });
    if (!album) throw new NotFoundException('Album not found');

    const verified = await this.hasPurchased(user.id, albumId);
    const existing = await this.reviewRepository.findOne({ where: { albumId, userId: user.id } });

    if (existing) {
      Object.assign(existing, {
        rating: dto.rating,
        title: dto.title ?? null,
        body: dto.body ?? null,
        isVerifiedPurchase: verified,
      });
      await this.reviewRepository.save(existing);
    } else {
      await this.reviewRepository.save(
        this.reviewRepository.create({
          albumId,
          userId: user.id,
          rating: dto.rating,
          title: dto.title ?? null,
          body: dto.body ?? null,
          isVerifiedPurchase: verified,
          status: ReviewStatus.PUBLISHED,
        }),
      );
    }

    await this.recomputeAlbumRating(albumId);
    const saved = await this.reviewRepository.findOneOrFail({
      where: { albumId, userId: user.id },
      relations: { user: true },
    });
    return this.toPublic(saved);
  }

  async list(albumId: string, query: PaginationQueryDto): Promise<Paginated<PublicReview>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { albumId, status: ReviewStatus.PUBLISHED },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      reviews.map((r) => this.toPublic(r)),
      total,
      page,
      limit,
    );
  }

  async remove(reviewId: string, user: RequestUser): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (user.role !== UserRole.ADMIN && review.userId !== user.id) {
      throw new ForbiddenException('You cannot delete this review');
    }
    await this.reviewRepository.softDelete({ id: reviewId });
    await this.recomputeAlbumRating(review.albumId);
  }
}
