import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ReportReason, ReportStatus, ReportTargetType } from '@photography/types';
import { SanitizeText } from '../../../common/transformers/sanitize';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  targetId!: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @SanitizeText()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

export class ResolveReportDto {
  @ApiProperty({ enum: [ReportStatus.RESOLVED, ReportStatus.DISMISSED, ReportStatus.REVIEWING] })
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @SanitizeText()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}
