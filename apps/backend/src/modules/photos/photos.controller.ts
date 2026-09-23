import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SlugParamDto, UuidParamDto } from '../../common/dto/uuid-param.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { ImageFileValidator } from '../../common/validators/image-file.validator';
import type { AuthenticatedRequest, RequestUser } from '../../common/types/authenticated-request';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { QueryPhotosDto } from './dto/query-photos.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { EngagementService } from './engagement.service';
import { PhotosService } from './photos.service';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(
    private readonly photosService: PhotosService,
    private readonly engagementService: EngagementService,
  ) {}

  // ---------- upload ----------

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        story: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        categoryId: { type: 'string', format: 'uuid' },
        albumId: { type: 'string', format: 'uuid' },
        isFeatured: { type: 'boolean' },
      },
    },
  })
  @ResponseMessage('Photo uploaded')
  @ApiOperation({ summary: '[Photographer] Upload a photo (auto thumbnail/WebP/AVIF/EXIF)' })
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES }),
          new ImageFileValidator({}),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreatePhotoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.photosService.upload(file, dto, user);
  }

  // ---------- public reads ----------

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Gallery — infinite-scroll list of published photos' })
  gallery(@Query() query: QueryPhotosDto, @Req() req: AuthenticatedRequest) {
    return this.photosService.findGallery(query, req.user?.id);
  }

  @ApiBearerAuth()
  @Get('me/bookmarks')
  @ApiOperation({ summary: 'My bookmarked photos (paginated)' })
  myBookmarks(@Query() query: PaginationQueryDto, @CurrentUser('id') userId: string) {
    return this.photosService.listMyBookmarks(userId, query);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published photo by slug (increments view count)' })
  findOne(@Param() { slug }: SlugParamDto, @Req() req: AuthenticatedRequest) {
    return this.photosService.findBySlug(slug, req.user?.id);
  }

  @Public()
  @Get(':slug/related')
  @ApiOperation({ summary: 'Related photos for a given photo' })
  related(@Param() { slug }: SlugParamDto) {
    return this.photosService.findRelated(slug);
  }

  @Public()
  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a photo (by photo id)' })
  comments(@Param() { id }: UuidParamDto, @Query() query: PaginationQueryDto) {
    return this.engagementService.listComments(id, query);
  }

  // ---------- management ----------

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Patch(':id')
  @ResponseMessage('Photo updated')
  @ApiOperation({ summary: '[Owner/Admin] Update photo metadata' })
  update(
    @Param() { id }: UuidParamDto,
    @Body() dto: UpdatePhotoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.photosService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Owner/Admin] Delete a photo' })
  remove(@Param() { id }: UuidParamDto, @CurrentUser() user: RequestUser) {
    return this.photosService.remove(id, user);
  }

  // ---------- engagement ----------

  @ApiBearerAuth()
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a photo' })
  like(@Param() { id }: UuidParamDto, @CurrentUser('id') userId: string) {
    return this.engagementService.like(id, userId);
  }

  @ApiBearerAuth()
  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a like' })
  unlike(@Param() { id }: UuidParamDto, @CurrentUser('id') userId: string) {
    return this.engagementService.unlike(id, userId);
  }

  @ApiBearerAuth()
  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bookmark a photo' })
  bookmark(@Param() { id }: UuidParamDto, @CurrentUser('id') userId: string) {
    return this.engagementService.bookmark(id, userId);
  }

  @ApiBearerAuth()
  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a bookmark' })
  unbookmark(@Param() { id }: UuidParamDto, @CurrentUser('id') userId: string) {
    return this.engagementService.unbookmark(id, userId);
  }

  @ApiBearerAuth()
  @Post(':id/comments')
  @ResponseMessage('Comment posted')
  @ApiOperation({ summary: 'Add a comment to a photo' })
  addComment(
    @Param() { id }: UuidParamDto,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.engagementService.addComment(id, userId, dto);
  }

  @ApiBearerAuth()
  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Author/Admin] Delete a comment' })
  deleteComment(@Param() { id }: UuidParamDto, @CurrentUser() user: RequestUser) {
    return this.engagementService.deleteComment(id, user);
  }
}
