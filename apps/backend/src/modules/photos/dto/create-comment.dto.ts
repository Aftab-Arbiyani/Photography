import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../common/transformers/sanitize';

export class CreateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @SanitizeText()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Parent comment id for a threaded reply' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
