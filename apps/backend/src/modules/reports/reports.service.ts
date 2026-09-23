import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationType,
  type Paginated,
  type PublicReport,
  ReportStatus,
} from '@photography/types';
import { normalizePagination, paginate } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Report } from './entities/report.entity';
import { CreateReportDto, ResolveReportDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reportRepository: Repository<Report>,
    private readonly notifications: NotificationsService,
  ) {}

  private toPublic(r: Report): PublicReport {
    return {
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      details: r.details,
      status: r.status,
      reporterId: r.reporterId,
      resolutionNote: r.resolutionNote,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async create(reporterId: string, dto: CreateReportDto): Promise<PublicReport> {
    const report = await this.reportRepository.save(
      this.reportRepository.create({
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details ?? null,
        status: ReportStatus.PENDING,
      }),
    );
    return this.toPublic(report);
  }

  async adminList(
    query: PaginationQueryDto & { status?: ReportStatus },
  ): Promise<Paginated<PublicReport>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [rows, total] = await this.reportRepository.findAndCount({
      where: query.status ? { status: query.status } : {},
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      rows.map((r) => this.toPublic(r)),
      total,
      page,
      limit,
    );
  }

  async resolve(id: string, adminId: string, dto: ResolveReportDto): Promise<PublicReport> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = dto.status;
    report.resolutionNote = dto.resolutionNote ?? null;
    report.resolvedBy = adminId;
    const saved = await this.reportRepository.save(report);

    if (dto.status === ReportStatus.RESOLVED || dto.status === ReportStatus.DISMISSED) {
      await this.notifications.emit({
        userId: report.reporterId,
        type: NotificationType.REPORT_RESOLVED,
        title: 'Your report was reviewed',
        body: `Your report has been ${dto.status}.`,
      });
    }
    return this.toPublic(saved);
  }
}
