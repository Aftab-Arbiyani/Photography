import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { TagsService } from './tags.service';
import { SetPhotoTagsDto } from './dto/set-tags.dto';

@ApiTags('tags')
@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get('tags/popular')
  @ApiOperation({ summary: 'Popular tags (tag cloud / discovery)' })
  popular() {
    return this.tagsService.popular();
  }

  @Public()
  @Get('tags/search')
  @ApiOperation({ summary: 'Tag autocomplete / search' })
  search(@Query('q') q: string) {
    return this.tagsService.search(q ?? '');
  }

  @Public()
  @Get('photos/:id/tags')
  @ApiOperation({ summary: 'Tags on a photo' })
  photoTags(@Param() { id }: UuidParamDto) {
    return this.tagsService.photoTags(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Put('photos/:id/tags')
  @ResponseMessage('Tags updated')
  @ApiOperation({ summary: '[Owner/Admin] Replace a photo’s tags' })
  setTags(
    @Param() { id }: UuidParamDto,
    @Body() dto: SetPhotoTagsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tagsService.setPhotoTags(id, dto.tags, user);
  }
}
