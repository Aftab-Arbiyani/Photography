import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DiscoveryService } from './discovery.service';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Public()
  @Get('trending/photos')
  @ApiOperation({ summary: 'Trending photos (weighted recent engagement)' })
  trendingPhotos() {
    return this.discoveryService.trendingPhotos();
  }

  @Public()
  @Get('popular/albums')
  @ApiOperation({ summary: 'Popular albums (by sales + rating)' })
  popularAlbums() {
    return this.discoveryService.popularAlbums();
  }

  @Public()
  @Get('featured/collections')
  @ApiOperation({ summary: 'Featured (curated) collections' })
  featuredCollections() {
    return this.discoveryService.featuredCollections();
  }
}
