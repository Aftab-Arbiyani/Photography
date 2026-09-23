import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentStatus, type Paginated, type PublicAlbum, UserRole } from '@photography/types';
import { normalizePagination, paginate, uniqueSlug, slugify } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { Album } from './entities/album.entity';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
  ) {}

  private toPublic(a: Album): PublicAlbum {
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      description: a.description,
      status: a.status,
      coverPhotoId: a.coverPhotoId,
      photographerId: a.photographerId,
      photosCount: a.photosCount,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  private async generateSlug(title: string): Promise<string> {
    const base = slugify(title);
    const exists = await this.albumRepository.findOne({ where: { slug: base } });
    return exists ? uniqueSlug(base) : base;
  }

  async create(dto: CreateAlbumDto, user: RequestUser): Promise<PublicAlbum> {
    const status = dto.status ?? ContentStatus.DRAFT;
    const album = this.albumRepository.create({
      ...dto,
      status,
      slug: await this.generateSlug(dto.title),
      photographerId: user.id,
      publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
    });
    return this.toPublic(await this.albumRepository.save(album));
  }

  /** Public listing — only published albums. */
  async findPublished(query: PaginationQueryDto): Promise<Paginated<PublicAlbum>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [albums, total] = await this.albumRepository.findAndCount({
      where: { status: ContentStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      albums.map((a) => this.toPublic(a)),
      total,
      page,
      limit,
    );
  }

  async findBySlug(slug: string): Promise<PublicAlbum> {
    const album = await this.albumRepository.findOne({ where: { slug } });
    if (!album || album.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Album not found');
    }
    return this.toPublic(album);
  }

  async getEntity(id: string): Promise<Album> {
    const album = await this.albumRepository.findOne({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');
    return album;
  }

  /** Owner or admin only. */
  private assertCanManage(album: Album, user: RequestUser): void {
    if (user.role !== UserRole.ADMIN && album.photographerId !== user.id) {
      throw new ForbiddenException('You do not own this album');
    }
  }

  async update(id: string, dto: UpdateAlbumDto, user: RequestUser): Promise<PublicAlbum> {
    const album = await this.getEntity(id);
    this.assertCanManage(album, user);

    if (dto.status === ContentStatus.PUBLISHED && !album.publishedAt) {
      album.publishedAt = new Date();
    }
    Object.assign(album, dto);
    return this.toPublic(await this.albumRepository.save(album));
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const album = await this.getEntity(id);
    this.assertCanManage(album, user);
    await this.albumRepository.softDelete({ id });
  }
}
