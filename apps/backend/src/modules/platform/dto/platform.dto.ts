import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CmsPageStatus } from '@photography/types';
import { SanitizeText } from '../../../common/transformers/sanitize';

export class UpsertSettingDto {
  @ApiProperty() @IsString() @MaxLength(120) key!: string;
  @ApiProperty({ description: 'Any JSON value' }) value!: unknown;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class UpsertFeatureFlagDto {
  @ApiProperty() @IsString() @MaxLength(120) key!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;
}

export class UpsertEmailTemplateDto {
  @ApiProperty() @IsString() @MaxLength(120) key!: string;
  @ApiProperty() @IsString() @MaxLength(200) subject!: string;
  @ApiProperty() @IsString() htmlBody!: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpsertCmsPageDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional({ enum: CmsPageStatus })
  @IsOptional()
  status?: CmsPageStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @SanitizeText()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @SanitizeText()
  @IsString()
  @MaxLength(320)
  metaDescription?: string;
}
