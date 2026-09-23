import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';
import { PremiumGuard } from './guards/premium.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, Subscription, User]),
    PaymentsModule, // re-uses StripeService
    ConfigModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PremiumGuard],
  exports: [SubscriptionsService, PremiumGuard],
})
export class SubscriptionsModule {}
