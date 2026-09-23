import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { Bookmark } from './entities/bookmark.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { Photo } from './entities/photo.entity';
import { EngagementService } from './engagement.service';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Like, Bookmark, Comment]), NotificationsModule],
  controllers: [PhotosController],
  providers: [PhotosService, EngagementService],
  exports: [PhotosService, EngagementService],
})
export class PhotosModule {}
