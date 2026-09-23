import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import type { PublicCategory } from '@photography/types';
import { slugify } from '@photography/utils';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  private toPublic(c: Category): PublicCategory {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      coverPhotoId: c.coverPhotoId,
      photosCount: c.photosCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  private async ensureUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);
    const where = excludeId ? { slug: base, id: Not(excludeId) } : { slug: base };
    const exists = await this.categoryRepository.findOne({ where });
    if (exists) throw new ConflictException(`Category slug "${base}" already exists`);
    return base;
  }

  async create(dto: CreateCategoryDto): Promise<PublicCategory> {
    const slug = await this.ensureUniqueSlug(dto.name);
    const category = this.categoryRepository.create({ ...dto, slug });
    return this.toPublic(await this.categoryRepository.save(category));
  }

  async findAll(): Promise<PublicCategory[]> {
    const categories = await this.categoryRepository.find({ order: { name: 'ASC' } });
    return categories.map((c) => this.toPublic(c));
  }

  async findBySlug(slug: string): Promise<PublicCategory> {
    const category = await this.categoryRepository.findOne({ where: { slug } });
    if (!category) throw new NotFoundException('Category not found');
    return this.toPublic(category);
  }

  async getEntity(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<PublicCategory> {
    const category = await this.getEntity(id);
    if (dto.name && dto.name !== category.name) {
      category.slug = await this.ensureUniqueSlug(dto.name, id);
    }
    Object.assign(category, dto);
    return this.toPublic(await this.categoryRepository.save(category));
  }

  async remove(id: string): Promise<void> {
    await this.getEntity(id);
    await this.categoryRepository.softDelete({ id });
  }
}
