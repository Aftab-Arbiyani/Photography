import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches, MaxLength } from 'class-validator';

/** Validates `:id` route params as UUIDs before the handler runs. */
export class UuidParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id!: string;
}

/**
 * Validates a `:slug` route param. The validation decorator is REQUIRED — under
 * the global `whitelist`/`forbidNonWhitelisted` ValidationPipe, a property with
 * no validator is stripped and then rejected, which would 400 every slug route.
 */
export class SlugParamDto {
  @ApiProperty()
  @Matches(/^[a-z0-9][a-z0-9-]*$/, { message: 'Invalid slug' })
  @MaxLength(240)
  slug!: string;
}
