import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus, UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { PhotographersService } from './photographers.service';
import {
  ApplyPhotographerDto,
  ReviewApplicationDto,
  SetCommissionDto,
  UpdatePhotographerProfileDto,
  VerifyPhotographerDto,
} from './dto/photographer.dto';

class ApplicationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

@ApiTags('photographers')
@Controller('photographers')
export class PhotographersController {
  constructor(private readonly photographersService: PhotographersService) {}

  // ---- onboarding (self) ----

  @ApiBearerAuth()
  @Post('apply')
  @ResponseMessage('Application submitted')
  @ApiOperation({ summary: 'Apply to become a photographer' })
  apply(@CurrentUser('id') userId: string, @Body() dto: ApplyPhotographerDto) {
    return this.photographersService.apply(userId, dto);
  }

  @ApiBearerAuth()
  @Get('me/application')
  @ApiOperation({ summary: 'My latest photographer application' })
  myApplication(@CurrentUser('id') userId: string) {
    return this.photographersService.myApplication(userId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Get('me/profile')
  @ApiOperation({ summary: 'My photographer profile' })
  myProfile(@CurrentUser('id') userId: string) {
    return this.photographersService.getPublicProfile(userId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Patch('me/profile')
  @ResponseMessage('Profile updated')
  @ApiOperation({ summary: 'Update my photographer profile (headline, payout)' })
  updateMyProfile(@CurrentUser('id') userId: string, @Body() dto: UpdatePhotographerProfileDto) {
    return this.photographersService.updateMyProfile(userId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Post('me/connect/onboard')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Stripe Connect onboarding link')
  @ApiOperation({ summary: 'Start/resume Stripe Connect onboarding for payouts' })
  startConnect(@CurrentUser('id') userId: string) {
    return this.photographersService.startConnectOnboarding(userId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Get('me/connect/status')
  @ApiOperation({ summary: 'Whether my connected account can receive payouts' })
  connectStatus(@CurrentUser('id') userId: string) {
    return this.photographersService.getConnectStatus(userId);
  }

  // ---- admin: applications, verification, commission ----

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/applications')
  @ApiOperation({ summary: '[Admin] Photographer application queue' })
  applications(@Query() query: ApplicationQueryDto) {
    return this.photographersService.adminList(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/applications/:id/review')
  @ResponseMessage('Application reviewed')
  @ApiOperation({ summary: '[Admin] Approve/reject an application (approval upgrades role)' })
  review(
    @Param() { id }: UuidParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.photographersService.review(id, adminId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/:userId/verify')
  @ResponseMessage('Verification updated')
  @ApiOperation({ summary: '[Admin] Set photographer verification status' })
  verify(@Param('userId') userId: string, @Body() dto: VerifyPhotographerDto) {
    return this.photographersService.setVerification(userId, dto.status);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/:userId/commission')
  @ResponseMessage('Commission updated')
  @ApiOperation({ summary: '[Admin] Set a photographer’s commission rate' })
  commission(@Param('userId') userId: string, @Body() dto: SetCommissionDto) {
    return this.photographersService.setCommission(userId, dto.commissionRate);
  }

  // ---- public profile ----

  @Public()
  @Get(':userId/profile')
  @ApiOperation({ summary: 'Public photographer profile (verification, headline)' })
  publicProfile(@Param('userId') userId: string) {
    return this.photographersService.getPublicProfile(userId);
  }
}
