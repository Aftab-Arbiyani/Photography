import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { type PublicTag, UserRole } from '@photography/types';
import { slugify } from '@photography/utils';
import type { RequestUser } from '../../common/types/authenticated-request';
import { Photo } from '../photos/entities/photo.entity';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    private readonly dataSource: DataSource,
  ) {}

  private toPublic(t: Tag): PublicTag {
    return { id: t.id, name: t.name, slug: t.slug, usageCount: t.usageCount };
  }

  /** Find-or-create tags by name, returning the entities. */
  private async upsertTags(names: string[]): Promise<Tag[]> {
    const normalized = [
      ...new Set(names.map((n) => ({ name: n.trim(), slug: slugify(n) })).filter((t) => t.slug)),
    ];
    if (normalized.length === 0) return [];
    const slugs = normalized.map((n) => n.slug);
    const existing = await this.tagRepository.find({ where: { slug: In(slugs) } });
    const existingSlugs = new Set(existing.map((t) => t.slug));
    const toCreate = normalized.filter((n) => !existingSlugs.has(n.slug));
    const created = toCreate.length
      ? await this.tagRepository.save(
          toCreate.map((n) => this.tagRepository.create({ name: n.name, slug: n.slug })),
        )
      : [];
    return [...existing, ...created];
  }

  /** Replace a photo's tags (owner/admin). Keeps tag usage counts in sync. */
  async setPhotoTags(photoId: string, names: string[], user: RequestUser): Promise<PublicTag[]> {
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('Photo not found');
    if (user.role !== UserRole.ADMIN && photo.photographerId !== user.id) {
      throw new ForbiddenException('You do not own this photo');
    }

    const tags = await this.upsertTags(names);
    const tagIds = tags.map((t) => t.id);

    await this.dataSource.transaction(async (manager) => {
      const previous: Array<{ tag_id: string }> = await manager.query(
        'SELECT tag_id FROM photo_tags WHERE photo_id = $1',
        [photoId],
      );
      await manager.query('DELETE FROM photo_tags WHERE photo_id = $1', [photoId]);
      if (tagIds.length) {
        const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await manager.query(`INSERT INTO photo_tags (photo_id, tag_id) VALUES ${values}`, [
          photoId,
          ...tagIds,
        ]);
      }
      // Recompute usage counts for affected tags.
      const affected = [...new Set([...previous.map((p) => p.tag_id), ...tagIds])];
      for (const tagId of affected) {
        const [{ count }] = await manager.query<{ count: string }[]>(
          'SELECT COUNT(*)::int AS count FROM photo_tags WHERE tag_id = $1',
          [tagId],
        );
        await manager.update(Tag, { id: tagId }, { usageCount: Number(count) });
      }
    });

    return tags.map((t) => this.toPublic(t));
  }

  async photoTags(photoId: string): Promise<PublicTag[]> {
    const rows: Array<{ id: string; name: string; slug: string; usage_count: number }> =
      await this.dataSource.query(
        `SELECT t.id, t.name, t.slug, t.usage_count
         FROM tags t JOIN photo_tags pt ON pt.tag_id = t.id
         WHERE pt.photo_id = $1 ORDER BY t.name ASC`,
        [photoId],
      );
    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, usageCount: r.usage_count }));
  }

  /** Popular tags (for tag clouds / discovery). */
  async popular(limit = 30): Promise<PublicTag[]> {
    const tags = await this.tagRepository.find({ order: { usageCount: 'DESC' }, take: limit });
    return tags.map((t) => this.toPublic(t));
  }

  /** Tags whose name matches a term (for autocomplete / tag search). */
  async search(term: string, limit = 20): Promise<PublicTag[]> {
    const tags = await this.tagRepository
      .createQueryBuilder('t')
      .where('t.name ILIKE :s', { s: `%${term}%` })
      .orderBy('t.usage_count', 'DESC')
      .take(limit)
      .getMany();
    return tags.map((t) => this.toPublic(t));
  }
}
