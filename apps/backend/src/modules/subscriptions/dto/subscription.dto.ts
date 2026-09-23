import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ description: 'Plan code to subscribe to', example: 'premium-monthly' })
  @IsString()
  @Length(2, 64)
  planCode!: string;
}
