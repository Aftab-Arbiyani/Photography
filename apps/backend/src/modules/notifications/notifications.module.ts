import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsStreamController } from './notifications-stream.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), JwtModule.register({}), ConfigModule],
  controllers: [NotificationsController, NotificationsStreamController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
