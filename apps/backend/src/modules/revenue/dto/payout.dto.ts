import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PayoutStatus } from '@photography/types';

export class RequestPayoutDto {
  @ApiProperty({ minimum: 100, description: 'Amount in cents to withdraw' })
  @Type(() => Number)
  @IsInt()
  @Min(100)
  amountCents!: number;
}

export class ProcessPayoutDto {
  @ApiProperty({ enum: [PayoutStatus.PROCESSING, PayoutStatus.PAID, PayoutStatus.FAILED] })
  @IsEnum(PayoutStatus)
  status!: PayoutStatus;

  @ApiPropertyOptional({ description: 'External transfer reference' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  failureReason?: string;
}
