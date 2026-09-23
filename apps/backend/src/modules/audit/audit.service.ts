import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type Paginated } from '@photography/types';
import { normalizePagination, paginate } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditRecord {
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  statusCode?: number | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectRepository(AuditLog) private readonly auditRepository: Repository<AuditLog>) {}

  /** Append an audit entry. Never throws into the request path. */
  async record(entry: AuditRecord): Promise<void> {
    try {
      await this.auditRepository.save(
        this.auditRepository.create({
          actorId: entry.actorId ?? null,
          action: entry.action.slice(0, 160),
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent?.slice(0, 512) ?? null,
          statusCode: entry.statusCode ?? null,
          metadata: entry.metadata ?? null,
        }),
      );
    } catch (error) {
      this.logger.warn(`audit record failed: ${(error as Error).message}`);
    }
  }

  async list(query: PaginationQueryDto & { actorId?: string }): Promise<Paginated<AuditLog>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [rows, total] = await this.auditRepository.findAndCount({
      where: query.actorId ? { actorId: query.actorId } : {},
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(rows, total, page, limit);
  }
}
