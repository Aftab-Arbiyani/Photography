import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator';
import { SanitizeText } from '../../../common/transformers/sanitize';

export class SetPhotoTagsDto {
  @ApiProperty({ type: [String], maxItems: 30, example: ['sunset', 'patagonia', 'long exposure'] })
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @SanitizeText()
  tags!: string[];
}
