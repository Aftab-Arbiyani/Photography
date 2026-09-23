import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CmsPageStatus, type PublicCmsPage } from '@photography/types';
import { slugify } from '@photography/utils';
import { CmsPage } from './entities/cms-page.entity';

@Injectable()
export class CmsService {
  constructor(@InjectRepository(CmsPage) private readonly pageRepository: Repository<CmsPage>) {}

  private toPublic(p: CmsPage): PublicCmsPage {
    return {
      slug: p.slug,
      title: p.title,
      body: p.body,
      status: p.status,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  /** Public read — only published pages. */
  async getPublished(slug: string): Promise<PublicCmsPage> {
    const page = await this.pageRepository.findOne({
      where: { slug, status: CmsPageStatus.PUBLISHED },
    });
    if (!page) throw new NotFoundException('Page not found');
    return this.toPublic(page);
  }

  async listPublished(): Promise<Array<{ slug: string; title: string; updatedAt: string }>> {
    const pages = await this.pageRepository.find({ where: { status: CmsPageStatus.PUBLISHED } });
    return pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  // ---- admin ----

  adminList(): Promise<CmsPage[]> {
    return this.pageRepository.find({ order: { updatedAt: 'DESC' } });
  }

  async create(data: Partial<CmsPage> & { title: string }): Promise<CmsPage> {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    if (await this.pageRepository.findOne({ where: { slug } })) {
      throw new ConflictException(`Page "${slug}" already exists`);
    }
    return this.pageRepository.save(this.pageRepository.create({ ...data, slug }));
  }

  async update(id: string, data: Partial<CmsPage>): Promise<CmsPage> {
    const page = await this.pageRepository.findOne({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    if (data.slug && data.slug !== page.slug) {
      const slug = slugify(data.slug);
      if (await this.pageRepository.findOne({ where: { slug, id: Not(id) } })) {
        throw new ConflictException(`Page "${slug}" already exists`);
      }
      page.slug = slug;
    }
    Object.assign(page, { ...data, slug: page.slug });
    return this.pageRepository.save(page);
  }

  async remove(id: string): Promise<void> {
    const result = await this.pageRepository.softDelete({ id });
    if (!result.affected) throw new NotFoundException('Page not found');
  }
}
