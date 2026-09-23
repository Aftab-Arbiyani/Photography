import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ShareChannel, ShareTargetType } from '@photography/types';

export class CreateShareDto {
  @ApiProperty({ enum: ShareTargetType })
  @IsEnum(ShareTargetType)
  targetType!: ShareTargetType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  targetId!: string;

  @ApiPropertyOptional({ enum: ShareChannel, default: ShareChannel.LINK })
  @IsOptional()
  @IsEnum(ShareChannel)
  channel?: ShareChannel;
}
