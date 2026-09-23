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
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, ManageCollectionPhotosDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published collections (paginated)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.collectionsService.findPublished(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published collection by slug' })
  findOne(@Param() { slug }: SlugParamDto) {
    return this.collectionsService.findBySlug(slug);
  }

  @Public()
  @Get(':slug/photos')
  @ApiOperation({ summary: 'List the published photos in a collection' })
  photos(@Param() { slug }: SlugParamDto) {
    return this.collectionsService.findPhotosBySlug(slug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post()
  @ResponseMessage('Collection created')
  @ApiOperation({ summary: '[Admin] Create a collection' })
  create(@Body() dto: CreateCollectionDto, @CurrentUser('id') userId: string) {
    return this.collectionsService.create(dto, userId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ResponseMessage('Collection updated')
  @ApiOperation({ summary: '[Admin] Update a collection' })
  update(@Param() { id }: UuidParamDto, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post(':id/photos')
  @ResponseMessage('Photos added to collection')
  @ApiOperation({ summary: '[Admin] Add photos to a collection' })
  addPhotos(@Param() { id }: UuidParamDto, @Body() dto: ManageCollectionPhotosDto) {
    return this.collectionsService.addPhotos(id, dto.photoIds);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id/photos')
  @ResponseMessage('Photos removed from collection')
  @ApiOperation({ summary: '[Admin] Remove photos from a collection' })
  removePhotos(@Param() { id }: UuidParamDto, @Body() dto: ManageCollectionPhotosDto) {
    return this.collectionsService.removePhotos(id, dto.photoIds);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a collection' })
  remove(@Param() { id }: UuidParamDto) {
    return this.collectionsService.remove(id);
  }
}
