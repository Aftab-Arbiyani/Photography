import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestDownloadDto {
  @ApiPropertyOptional({ description: 'Best-effort client device fingerprint hash' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceFingerprint?: string;
}
