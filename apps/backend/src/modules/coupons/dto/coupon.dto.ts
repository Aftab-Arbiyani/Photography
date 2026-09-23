import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { CouponType } from '@photography/types';

export class CreateCouponDto {
  @ApiProperty({ example: 'LAUNCH20' })
  @IsString()
  @Length(3, 64)
  code!: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type!: CouponType;

  @ApiProperty({ description: 'percent (0–100) or fixed amount in cents', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  value!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minSubtotalCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  @Length(3, 64)
  code!: string;

  @ApiProperty({ description: 'Cart subtotal in cents to validate the minimum against' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  subtotalCents!: number;
}
