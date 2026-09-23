import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { FollowsService } from './follows.service';

@ApiTags('photographers')
@Controller('photographers')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Photographer public profile (with isFollowing when authed)' })
  profile(@Param() { id }: UuidParamDto, @Req() req: AuthenticatedRequest) {
    return this.followsService.getProfile(id, req.user?.id);
  }

  @ApiBearerAuth()
  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a photographer' })
  follow(@Param() { id }: UuidParamDto, @CurrentUser('id') userId: string) {
    return this.followsService.follow(userId, id);
  }

  @ApiBearerAuth()
  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a photographer' })
  unfollow(@Param() { id }: UuidParamDto, @CurrentUser('id') userId: string) {
    return this.followsService.unfollow(userId, id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/followers')
  @ApiOperation({ summary: 'List a photographer’s followers' })
  followers(
    @Param() { id }: UuidParamDto,
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.followsService.followers(id, query, req.user?.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/following')
  @ApiOperation({ summary: 'List who a photographer follows' })
  following(
    @Param() { id }: UuidParamDto,
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.followsService.following(id, query, req.user?.id);
  }
}
