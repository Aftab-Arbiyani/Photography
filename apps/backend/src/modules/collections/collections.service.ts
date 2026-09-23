import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ContentStatus,
  type Paginated,
  type PublicCollection,
  type PublicPhoto,
} from '@photography/types';
import { normalizePagination, paginate, slugify, uniqueSlug } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { StorageService } from '../../storage/storage.service';
import { Photo } from '../photos/entities/photo.entity';
import { toPublicPhoto } from '../photos/photo.mapper';
import { Collection } from './entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly storage: StorageService,
  ) {}

  private toPublic(c: Collection): PublicCollection {
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      status: c.status,
      coverPhotoId: c.coverPhotoId,
      isCurated: c.isCurated,
      photosCount: c.photosCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  private async generateSlug(title: string): Promise<string> {
    const base = slugify(title);
    const exists = await this.collectionRepository.findOne({ where: { slug: base } });
    return exists ? uniqueSlug(base) : base;
  }

  private async loadPhotos(ids: string[]): Promise<Photo[]> {
    if (!ids.length) return [];
    return this.photoRepository.findBy({ id: In(ids) });
  }

  async create(dto: CreateCollectionDto, curatorId: string): Promise<PublicCollection> {
    const photos = await this.loadPhotos(dto.photoIds ?? []);
    const status = dto.status ?? ContentStatus.DRAFT;
    const collection = this.collectionRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      status,
      isCurated: dto.isCurated ?? false,
      slug: await this.generateSlug(dto.title),
      curatorId,
      photos,
      photosCount: photos.length,
    });
    return this.toPublic(await this.collectionRepository.save(collection));
  }

  async findPublished(query: PaginationQueryDto): Promise<Paginated<PublicCollection>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [collections, total] = await this.collectionRepository.findAndCount({
      where: { status: ContentStatus.PUBLISHED },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      collections.map((c) => this.toPublic(c)),
      total,
      page,
      limit,
    );
  }

  async findBySlug(slug: string): Promise<PublicCollection> {
    const collection = await this.collectionRepository.findOne({ where: { slug } });
    if (!collection || collection.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Collection not found');
    }
    return this.toPublic(collection);
  }

  /** Published photos belonging to a published collection (bounded set, no pagination). */
  async findPhotosBySlug(slug: string): Promise<PublicPhoto[]> {
    const collection = await this.collectionRepository.findOne({
      where: { slug },
      relations: { photos: true },
    });
    if (!collection || collection.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Collection not found');
    }
    return collection.photos
      .filter((p) => p.status === ContentStatus.PUBLISHED && !p.deletedAt)
      .map((p) => toPublicPhoto(p, this.storage));
  }

  async getEntity(id: string, withPhotos = false): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: withPhotos ? { photos: true } : {},
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async update(id: string, dto: UpdateCollectionDto): Promise<PublicCollection> {
    const collection = await this.getEntity(id);
    if (dto.title && dto.title !== collection.title) {
      collection.slug = await this.generateSlug(dto.title);
    }
    Object.assign(collection, dto);
    return this.toPublic(await this.collectionRepository.save(collection));
  }

  async addPhotos(id: string, photoIds: string[]): Promise<PublicCollection> {
    const collection = await this.getEntity(id, true);
    const existing = new Set(collection.photos.map((p) => p.id));
    const toAdd = (await this.loadPhotos(photoIds)).filter((p) => !existing.has(p.id));
    collection.photos = [...collection.photos, ...toAdd];
    collection.photosCount = collection.photos.length;
    return this.toPublic(await this.collectionRepository.save(collection));
  }

  async removePhotos(id: string, photoIds: string[]): Promise<PublicCollection> {
    const collection = await this.getEntity(id, true);
    const remove = new Set(photoIds);
    collection.photos = collection.photos.filter((p) => !remove.has(p.id));
    collection.photosCount = collection.photos.length;
    return this.toPublic(await this.collectionRepository.save(collection));
  }

  async remove(id: string): Promise<void> {
    await this.getEntity(id);
    await this.collectionRepository.softDelete({ id });
  }
}
