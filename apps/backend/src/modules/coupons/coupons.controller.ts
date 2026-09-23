import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@photography/types';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon against a subtotal (returns the discount)' })
  async validate(@Body() dto: ValidateCouponDto) {
    const { coupon, discountCents } = await this.couponsService.validate(
      dto.code,
      dto.subtotalCents,
    );
    return { code: coupon.code, type: coupon.type, value: coupon.value, discountCents };
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: '[Admin] List coupons' })
  findAll() {
    return this.couponsService.findAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post()
  @ResponseMessage('Coupon created')
  @ApiOperation({ summary: '[Admin] Create a coupon' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ResponseMessage('Coupon updated')
  @ApiOperation({ summary: '[Admin] Update a coupon' })
  update(@Param() { id }: UuidParamDto, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a coupon' })
  remove(@Param() { id }: UuidParamDto) {
    return this.couponsService.remove(id);
  }
}
