import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { AnalyticsEventType } from '@photography/types';

export class TrackEventDto {
  @ApiProperty({ enum: AnalyticsEventType })
  @IsEnum(AnalyticsEventType)
  type!: AnalyticsEventType;

  @ApiPropertyOptional({ description: 'Anonymous client visitor id' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  visitorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'ISO start date (default: 30 days ago)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO end date (default: now)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
