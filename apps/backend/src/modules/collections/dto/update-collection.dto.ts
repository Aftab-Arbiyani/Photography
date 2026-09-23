import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCollectionDto } from './create-collection.dto';

// Photo membership is managed via dedicated endpoints, not the update body.
export class UpdateCollectionDto extends PartialType(
  OmitType(CreateCollectionDto, ['photoIds'] as const),
) {}
