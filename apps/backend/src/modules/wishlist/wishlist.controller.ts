import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'List my wishlist' })
  list(@CurrentUser('id') userId: string) {
    return this.wishlistService.list(userId);
  }

  @Post(':albumId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add an album to my wishlist' })
  add(@CurrentUser('id') userId: string, @Param('albumId') albumId: string) {
    return this.wishlistService.add(userId, albumId);
  }

  @Delete(':albumId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an album from my wishlist' })
  remove(@CurrentUser('id') userId: string, @Param('albumId') albumId: string) {
    return this.wishlistService.remove(userId, albumId);
  }
}
