import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';
import { CursorQueryDto } from '../../../common/dto/cursor-query.dto';

/**
 * Gallery query: cursor (keyset) pagination for infinite scroll, plus filters.
 * Only PUBLISHED photos are returned by the public gallery.
 */
export class QueryPhotosDto extends CursorQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by category' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by album' })
  @IsOptional()
  @IsUUID('4')
  albumId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by photographer' })
  @IsOptional()
  @IsUUID('4')
  photographerId?: string;

  @ApiPropertyOptional({ description: 'Free-text search over title/description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Only featured photos', enum: ['true', 'false'] })
  @IsOptional()
  @IsBooleanString()
  featured?: string;
}
