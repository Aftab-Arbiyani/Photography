import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  albumId!: string;

  @ApiProperty({ format: 'uuid', description: 'Chosen pricing tier' })
  @IsUUID('4')
  pricingId!: string;
}

export class ApplyCouponDto {
  @ApiProperty()
  @IsString()
  @Length(3, 64)
  code!: string;
}
