import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PayoutStatus, UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { RevenueService } from './revenue.service';
import { ProcessPayoutDto, RequestPayoutDto } from './dto/payout.dto';

class PayoutQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;
}

@ApiTags('revenue')
@ApiBearerAuth()
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  // ---- photographer (self) ----

  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Get('me/earnings')
  @ApiOperation({ summary: 'My earnings (gross, commission, net, available)' })
  earnings(@CurrentUser('id') userId: string) {
    return this.revenueService.getEarnings(userId);
  }

  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Get('me/dashboard')
  @ApiOperation({ summary: 'My photographer dashboard (earnings + content + audience)' })
  dashboard(@CurrentUser('id') userId: string) {
    return this.revenueService.dashboard(userId);
  }

  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Get('me/payouts')
  @ApiOperation({ summary: 'My payout history' })
  myPayouts(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.revenueService.myPayouts(userId, query);
  }

  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Post('me/payouts')
  @ResponseMessage('Payout requested')
  @ApiOperation({ summary: 'Request a payout of available balance' })
  requestPayout(@CurrentUser('id') userId: string, @Body() dto: RequestPayoutDto) {
    return this.revenueService.requestPayout(userId, dto.amountCents);
  }

  // ---- admin ----

  @Roles(UserRole.ADMIN)
  @Get('admin/payouts')
  @ApiOperation({ summary: '[Admin] Payout queue' })
  adminPayouts(@Query() query: PayoutQueryDto) {
    return this.revenueService.adminListPayouts(query.status, query);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/payouts/:id')
  @ResponseMessage('Payout updated')
  @ApiOperation({ summary: '[Admin] Process a payout (paid/failed)' })
  process(
    @Param() { id }: UuidParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: ProcessPayoutDto,
  ) {
    return this.revenueService.processPayout(
      id,
      adminId,
      dto.status,
      dto.reference,
      dto.failureReason,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/summary')
  @ApiOperation({ summary: '[Admin] Platform revenue summary (gross, commission, payouts)' })
  summary() {
    return this.revenueService.platformRevenue();
  }
}
