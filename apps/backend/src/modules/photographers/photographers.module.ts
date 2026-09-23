import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { User } from '../users/entities/user.entity';
import { PhotographerApplication } from './entities/photographer-application.entity';
import { PhotographerProfile } from './entities/photographer-profile.entity';
import { PhotographersController } from './photographers.controller';
import { PhotographersService } from './photographers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhotographerApplication, PhotographerProfile, User]),
    NotificationsModule,
    PaymentsModule,
    ConfigModule,
  ],
  controllers: [PhotographersController],
  providers: [PhotographersService],
  exports: [PhotographersService, TypeOrmModule],
})
export class PhotographersModule {}
