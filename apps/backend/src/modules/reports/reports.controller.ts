import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus, UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { ReportsService } from './reports.service';
import { CreateReportDto, ResolveReportDto } from './dto/report.dto';

class AdminReportQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ResponseMessage('Report submitted — thank you')
  @ApiOperation({ summary: 'Report a photo, album, collection, comment or user' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.reportsService.create(userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: '[Admin] Moderation queue (filter by status)' })
  adminList(@Query() query: AdminReportQueryDto) {
    return this.reportsService.adminList(query);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/resolve')
  @ResponseMessage('Report updated')
  @ApiOperation({ summary: '[Admin] Resolve or dismiss a report' })
  resolve(
    @Param() { id }: UuidParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, adminId, dto);
  }
}
