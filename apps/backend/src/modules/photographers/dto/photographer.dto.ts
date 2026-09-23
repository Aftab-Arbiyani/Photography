import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApplicationStatus, PayoutMethod, VerificationStatus } from '@photography/types';
import { SanitizeText } from '../../../common/transformers/sanitize';

export class ApplyPhotographerDto {
  @ApiProperty({ maxLength: 2000, description: 'Why you want to sell on the platform' })
  @SanitizeText()
  @IsString()
  @MaxLength(2000)
  statement!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;
}

export class ReviewApplicationDto {
  @ApiProperty({
    enum: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.UNDER_REVIEW],
  })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @SanitizeText()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}

export class UpdatePhotographerProfileDto {
  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @SanitizeText()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @ApiPropertyOptional({ enum: PayoutMethod })
  @IsOptional()
  @IsEnum(PayoutMethod)
  payoutMethod?: PayoutMethod;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  payoutDetails?: Record<string, unknown>;
}

export class VerifyPhotographerDto {
  @ApiProperty({ enum: VerificationStatus })
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;
}

export class SetCommissionDto {
  @ApiProperty({ minimum: 0, maximum: 1, description: 'Platform commission (0..1)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate!: number;
}
