import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbumAsset } from '../albums/entities/album-asset.entity';
import { Entitlement } from '../orders/entities/entitlement.entity';
import { User } from '../users/entities/user.entity';
import { Download } from './entities/download.entity';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Download, Entitlement, AlbumAsset, User])],
  controllers: [DownloadsController],
  providers: [DownloadsService],
  exports: [DownloadsService],
})
export class DownloadsModule {}
