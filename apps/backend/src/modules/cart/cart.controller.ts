import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { CartService } from './cart.service';
import { AddToCartDto, ApplyCouponDto } from './dto/cart.dto';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get my cart with computed totals' })
  view(@CurrentUser('id') userId: string) {
    return this.cartService.view(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add (or re-tier) an album in the cart' })
  add(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto.albumId, dto.pricingId);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove an album from the cart (by album id)' })
  remove(@CurrentUser('id') userId: string, @Param() { id }: UuidParamDto) {
    return this.cartService.removeItem(userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Empty the cart' })
  clear(@CurrentUser('id') userId: string) {
    return this.cartService.clear(userId);
  }

  @Post('coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a coupon to the cart' })
  applyCoupon(@CurrentUser('id') userId: string, @Body() dto: ApplyCouponDto) {
    return this.cartService.applyCoupon(userId, dto.code);
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove the applied coupon' })
  removeCoupon(@CurrentUser('id') userId: string) {
    return this.cartService.removeCoupon(userId);
  }
}
