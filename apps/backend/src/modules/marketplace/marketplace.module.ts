import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from '../albums/entities/album.entity';
import { AlbumPricing } from '../albums/entities/album-pricing.entity';
import { AlbumAsset } from '../albums/entities/album-asset.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';
import { Entitlement } from '../orders/entities/entitlement.entity';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [TypeOrmModule.forFeature([Album, AlbumPricing, AlbumAsset, WishlistItem, Entitlement])],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
