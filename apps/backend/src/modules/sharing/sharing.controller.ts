import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ShareChannel } from '@photography/types';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { SharingService } from './sharing.service';
import { CreateShareDto } from './dto/share.dto';

@ApiTags('share')
@Controller('share')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a share and get the canonical share URL + count' })
  share(@Body() dto: CreateShareDto, @Req() req: AuthenticatedRequest & Request) {
    return this.sharingService.share(
      dto.targetType,
      dto.targetId,
      dto.channel ?? ShareChannel.LINK,
      req.user?.id ?? null,
      req.ip ?? null,
    );
  }
}
