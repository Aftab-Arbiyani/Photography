import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscription.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List active membership plans' })
  plans() {
    return this.subscriptionsService.listPlans();
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'My current subscription + membership state' })
  async me(@CurrentUser('id') userId: string) {
    const [subscription, membership] = await Promise.all([
      this.subscriptionsService.mySubscription(userId),
      this.subscriptionsService.getMembership(userId),
    ]);
    return { subscription, membership };
  }

  @ApiBearerAuth()
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Subscription checkout started')
  @ApiOperation({
    summary: 'Subscribe to a plan (free activates; paid returns a Stripe Checkout URL)',
  })
  checkout(@CurrentUser('id') userId: string, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(userId, dto.planCode);
  }

  @ApiBearerAuth()
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Subscription will cancel at period end')
  @ApiOperation({ summary: 'Cancel my subscription at period end' })
  cancel(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.cancel(userId);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    if (!req.rawBody || !signature) {
      throw new BadRequestException('Missing Stripe webhook payload or signature');
    }
    return this.subscriptionsService.handleWebhook(req.rawBody, signature);
  }
}
