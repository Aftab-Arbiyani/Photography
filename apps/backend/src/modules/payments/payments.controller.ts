import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Body,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import type { RequestUser } from '../../common/types/authenticated-request';
import { PaymentsService } from './payments.service';
import { RefundOrderDto } from './dto/refund.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Checkout started')
  @ApiOperation({ summary: 'Create an order from the cart and a Stripe PaymentIntent' })
  checkout(@CurrentUser() user: RequestUser) {
    return this.paymentsService.checkout(user);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody || !signature) {
      throw new BadRequestException('Missing Stripe webhook payload or signature');
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('refund/:id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Refund processed')
  @ApiOperation({ summary: '[Admin] Refund an order (full or partial)' })
  refund(@Param() { id }: UuidParamDto, @Body() dto: RefundOrderDto) {
    return this.paymentsService.refund(id, dto.amountCents);
  }
}
