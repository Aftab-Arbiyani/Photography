import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SlugParamDto, UuidParamDto } from '../../common/dto/uuid-param.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import type { AuthenticatedRequest, RequestUser } from '../../common/types/authenticated-request';
import { MarketplaceService } from './marketplace.service';
import {
  AlbumSaleSettingsDto,
  CreatePricingDto,
  QueryMarketplaceDto,
  RegisterAssetDto,
  SignAssetUploadDto,
  UpdatePricingDto,
} from './dto/marketplace.dto';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  // ---------------- public reads (optional auth → viewer flags) ----------------

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('albums')
  @ApiOperation({ summary: 'Browse albums for sale (filters: featured, search, sort)' })
  list(@Query() query: QueryMarketplaceDto, @Req() req: AuthenticatedRequest) {
    return this.marketplace.listForSale(query, req.user?.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('albums/featured')
  @ApiOperation({ summary: 'Featured albums' })
  featured(@Req() req: AuthenticatedRequest) {
    return this.marketplace.listFeatured(req.user?.id);
  }

  @ApiBearerAuth()
  @Get('recently-viewed')
  @ApiOperation({ summary: 'My recently viewed albums' })
  recentlyViewed(@CurrentUser('id') userId: string) {
    return this.marketplace.recentlyViewed(userId);
  }

  @Public()
  @Get('albums/:id/pricing')
  @ApiOperation({ summary: 'List an album’s pricing tiers (effective prices)' })
  pricing(@Param() { id }: UuidParamDto) {
    return this.marketplace.listPricing(id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('albums/:slug')
  @ApiOperation({ summary: 'Marketplace album detail (records recently-viewed when authed)' })
  detail(@Param() { slug }: SlugParamDto, @Req() req: AuthenticatedRequest) {
    return this.marketplace.getBySlug(slug, req.user);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('albums/:slug/related')
  @ApiOperation({ summary: 'Related albums' })
  related(@Param() { slug }: SlugParamDto, @Req() req: AuthenticatedRequest) {
    return this.marketplace.related(slug, req.user?.id);
  }

  // ---------------- owner / admin: sale settings ----------------

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Patch('albums/:id/settings')
  @ResponseMessage('Sale settings updated')
  @ApiOperation({ summary: '[Owner/Admin] Toggle for-sale / featured / discount / trailer' })
  settings(
    @Param() { id }: UuidParamDto,
    @Body() dto: AlbumSaleSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.marketplace.updateSaleSettings(id, dto, user);
  }

  // ---------------- owner / admin: pricing ----------------

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Post('albums/:id/pricing')
  @ResponseMessage('Pricing tier created')
  @ApiOperation({ summary: '[Owner/Admin] Add a pricing tier' })
  createPricing(
    @Param() { id }: UuidParamDto,
    @Body() dto: CreatePricingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.marketplace.createPricing(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Patch('albums/:id/pricing/:pricingId')
  @ResponseMessage('Pricing tier updated')
  @ApiOperation({ summary: '[Owner/Admin] Update a pricing tier' })
  updatePricing(
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
    @Body() dto: UpdatePricingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.marketplace.updatePricing(id, pricingId, dto, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Delete('albums/:id/pricing/:pricingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Owner/Admin] Delete a pricing tier' })
  removePricing(
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.marketplace.removePricing(id, pricingId, user);
  }

  // ---------------- owner / admin: deliverable assets ----------------

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Post('albums/:id/assets/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Owner/Admin] Get a signed URL to upload a private deliverable' })
  signUpload(
    @Param() { id }: UuidParamDto,
    @Body() dto: SignAssetUploadDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.marketplace.signAssetUpload(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Post('albums/:id/assets')
  @ResponseMessage('Asset registered')
  @ApiOperation({ summary: '[Owner/Admin] Register an uploaded deliverable' })
  registerAsset(
    @Param() { id }: UuidParamDto,
    @Body() dto: RegisterAssetDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.marketplace.registerAsset(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Get('albums/:id/assets')
  @ApiOperation({ summary: '[Owner/Admin] List an album’s deliverables' })
  listAssets(@Param() { id }: UuidParamDto, @CurrentUser() user: RequestUser) {
    return this.marketplace.listAssets(id, user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  @Delete('albums/:id/assets/:assetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Owner/Admin] Delete a deliverable' })
  removeAsset(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.marketplace.removeAsset(id, assetId, user);
  }
}
