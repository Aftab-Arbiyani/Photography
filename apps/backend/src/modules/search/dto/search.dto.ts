import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GlobalSearchDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class PhotoSearchDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text term (title/description/location)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ description: 'Camera make/model' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  camera?: string;

  @ApiPropertyOptional({ description: 'Lens model' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  lens?: string;

  @ApiPropertyOptional({ description: 'Capture location' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'Tag slug' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  tag?: string;

  @ApiPropertyOptional({ description: 'Category id' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryId?: string;
}
