import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SlugParamDto, UuidParamDto } from '../../common/dto/uuid-param.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@ApiTags('albums')
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published albums (paginated)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.albumsService.findPublished(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published album by slug' })
  findOne(@Param() { slug }: SlugParamDto) {
    return this.albumsService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Post()
  @ResponseMessage('Album created')
  @ApiOperation({ summary: '[Photographer] Create an album' })
  create(@Body() dto: CreateAlbumDto, @CurrentUser() user: RequestUser) {
    return this.albumsService.create(dto, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Patch(':id')
  @ResponseMessage('Album updated')
  @ApiOperation({ summary: '[Owner/Admin] Update an album' })
  update(
    @Param() { id }: UuidParamDto,
    @Body() dto: UpdateAlbumDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.albumsService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Owner/Admin] Delete an album' })
  remove(@Param() { id }: UuidParamDto, @CurrentUser() user: RequestUser) {
    return this.albumsService.remove(id, user);
  }
}
