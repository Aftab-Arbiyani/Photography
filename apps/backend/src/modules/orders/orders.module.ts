import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from '../albums/entities/album.entity';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Entitlement } from './entities/entitlement.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Entitlement, Album, User]),
    CartModule,
    CouponsModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, InvoiceService],
  exports: [OrdersService, InvoiceService],
})
export class OrdersModule {}
