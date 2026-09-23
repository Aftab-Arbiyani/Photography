import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from '../albums/entities/album.entity';
import { AlbumPricing } from '../albums/entities/album-pricing.entity';
import { CouponsModule } from '../coupons/coupons.module';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PricingService } from './pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Album, AlbumPricing]), CouponsModule],
  controllers: [CartController],
  providers: [CartService, PricingService],
  exports: [CartService, PricingService],
})
export class CartModule {}
