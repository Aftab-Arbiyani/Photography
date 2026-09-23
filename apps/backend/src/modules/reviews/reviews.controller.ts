import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('albums/:id/reviews')
  @ApiOperation({ summary: 'List reviews for an album' })
  list(@Param() { id }: UuidParamDto, @Query() query: PaginationQueryDto) {
    return this.reviewsService.list(id, query);
  }

  @ApiBearerAuth()
  @Put('albums/:id/reviews')
  @ResponseMessage('Review saved')
  @ApiOperation({ summary: 'Create or update my review for an album (verified if purchased)' })
  upsert(
    @Param() { id }: UuidParamDto,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reviewsService.createOrUpdate(id, user, dto);
  }

  @ApiBearerAuth()
  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Author/Admin] Delete a review' })
  remove(@Param() { id }: UuidParamDto, @CurrentUser() user: RequestUser) {
    return this.reviewsService.remove(id, user);
  }
}
