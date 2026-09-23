import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { SearchService } from './search.service';
import { GlobalSearchDto, PhotoSearchDto } from './dto/search.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Global search across photos, albums, collections, categories, tags' })
  global(@Query() dto: GlobalSearchDto, @Req() req: AuthenticatedRequest) {
    return this.searchService.global(dto.q ?? '', req.user?.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('photos')
  @ApiOperation({ summary: 'Faceted photo search (camera / lens / location / tag / category)' })
  photos(@Query() dto: PhotoSearchDto, @Req() req: AuthenticatedRequest) {
    return this.searchService.photos(dto, req.user?.id);
  }

  @Public()
  @Get('facets')
  @ApiOperation({ summary: 'Available search facets (cameras, lenses, tags, categories)' })
  facets() {
    return this.searchService.facets();
  }
}
