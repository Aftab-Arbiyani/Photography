import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { AnalyticsService } from './analytics.service';
import { DashboardQueryDto, TrackEventDto } from './dto/analytics.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('events')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Capture a client analytics event (pageview/search/…)' })
  async track(
    @Body() dto: TrackEventDto,
    @Req() req: AuthenticatedRequest,
    @Headers('x-visitor-id') headerVisitorId?: string,
  ): Promise<void> {
    await this.analyticsService.record({
      type: dto.type,
      visitorId: dto.visitorId ?? headerVisitorId ?? null,
      userId: req.user?.id ?? null,
      path: dto.path ?? null,
      query: dto.query ?? null,
      referrer: dto.referrer ?? null,
    });
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('dashboard')
  @ApiOperation({
    summary: '[Admin] Analytics dashboard (visitors, sales, revenue, top searches…)',
  })
  dashboard(@Query() query: DashboardQueryDto, @CurrentUser('id') _adminId: string) {
    return this.analyticsService.dashboard(query.from, query.to);
  }
}
