import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from '../albums/entities/album.entity';
import { Category } from '../categories/entities/category.entity';
import { Collection } from '../collections/entities/collection.entity';
import { Photo } from '../photos/entities/photo.entity';
import { Tag } from '../tags/entities/tag.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Album, Collection, Category, Tag]), AnalyticsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
