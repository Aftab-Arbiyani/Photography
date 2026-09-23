import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SlugParamDto } from '../../common/dto/uuid-param.dto';
import { CmsService } from './cms.service';
import { FeatureFlagsService } from './feature-flags.service';
import { SettingsService } from './settings.service';

@ApiTags('platform')
@Controller()
export class PlatformPublicController {
  constructor(
    private readonly settings: SettingsService,
    private readonly featureFlags: FeatureFlagsService,
    private readonly cms: CmsService,
  ) {}

  @Public()
  @Get('settings/public')
  @ApiOperation({ summary: 'Public platform settings (branding, toggles)' })
  publicSettings() {
    return this.settings.publicSettings();
  }

  @Public()
  @Get('feature-flags')
  @ApiOperation({ summary: 'Enabled feature flags' })
  flags() {
    return this.featureFlags.publicList();
  }

  @Public()
  @Get('pages')
  @ApiOperation({ summary: 'List published CMS pages' })
  pages() {
    return this.cms.listPublished();
  }

  @Public()
  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get a published CMS page by slug' })
  page(@Param() { slug }: SlugParamDto) {
    return this.cms.getPublished(slug);
  }
}
