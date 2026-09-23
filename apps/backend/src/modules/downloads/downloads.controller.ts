import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { DownloadsService } from './downloads.service';
import { RequestDownloadDto } from './dto/request-download.dto';

@ApiTags('downloads')
@ApiBearerAuth()
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('library')
  @ApiOperation({ summary: 'My purchased albums + deliverables (download library)' })
  library(@CurrentUser('id') userId: string) {
    return this.downloadsService.listMyEntitlements(userId);
  }

  @Post('assets/:id')
  @ResponseMessage('Download link issued')
  @ApiOperation({
    summary: 'Request a signed, watermarked, audited download for a purchased asset',
  })
  request(
    @Param() { id }: UuidParamDto,
    @Body() dto: RequestDownloadDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.downloadsService.requestDownload(userId, id, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      deviceFingerprint: dto.deviceFingerprint ?? null,
    });
  }

  @Get('history')
  @ApiOperation({ summary: 'My download history (audit log)' })
  history(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.downloadsService.history(userId, query);
  }
}
