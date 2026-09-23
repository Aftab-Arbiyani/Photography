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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@photography/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { CmsService } from './cms.service';
import { EmailTemplatesService } from './email-templates.service';
import { FeatureFlagsService } from './feature-flags.service';
import { SettingsService } from './settings.service';
import {
  UpsertCmsPageDto,
  UpsertEmailTemplateDto,
  UpsertFeatureFlagDto,
  UpsertSettingDto,
} from './dto/platform.dto';

@ApiTags('platform')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/platform')
export class PlatformAdminController {
  constructor(
    private readonly settings: SettingsService,
    private readonly featureFlags: FeatureFlagsService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly cms: CmsService,
  ) {}

  // ---- settings ----
  @Get('settings')
  @ApiOperation({ summary: '[Admin] All platform settings' })
  allSettings() {
    return this.settings.all();
  }

  @Post('settings')
  @ResponseMessage('Setting saved')
  @ApiOperation({ summary: '[Admin] Create/update a setting' })
  setSetting(@Body() dto: UpsertSettingDto) {
    return this.settings.set(dto.key, dto.value, {
      category: dto.category,
      description: dto.description,
      isPublic: dto.isPublic,
    });
  }

  @Delete('settings/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a setting' })
  deleteSetting(@Param('key') key: string) {
    return this.settings.remove(key);
  }

  // ---- feature flags ----
  @Get('feature-flags')
  @ApiOperation({ summary: '[Admin] All feature flags' })
  allFlags() {
    return this.featureFlags.list();
  }

  @Post('feature-flags')
  @ResponseMessage('Feature flag saved')
  @ApiOperation({ summary: '[Admin] Create/update a feature flag' })
  setFlag(@Body() dto: UpsertFeatureFlagDto) {
    return this.featureFlags.upsert(dto.key, dto);
  }

  // ---- email templates ----
  @Get('email-templates')
  @ApiOperation({ summary: '[Admin] List email templates' })
  templates() {
    return this.emailTemplates.list();
  }

  @Post('email-templates')
  @ResponseMessage('Template saved')
  @ApiOperation({ summary: '[Admin] Create/update an email template' })
  setTemplate(@Body() dto: UpsertEmailTemplateDto) {
    return this.emailTemplates.upsert(dto.key, dto);
  }

  // ---- CMS pages ----
  @Get('pages')
  @ApiOperation({ summary: '[Admin] List all CMS pages' })
  pages() {
    return this.cms.adminList();
  }

  @Post('pages')
  @ResponseMessage('Page created')
  @ApiOperation({ summary: '[Admin] Create a CMS page' })
  createPage(@Body() dto: UpsertCmsPageDto) {
    return this.cms.create(dto);
  }

  @Patch('pages/:id')
  @ResponseMessage('Page updated')
  @ApiOperation({ summary: '[Admin] Update a CMS page' })
  updatePage(@Param() { id }: UuidParamDto, @Body() dto: UpsertCmsPageDto) {
    return this.cms.update(id, dto);
  }

  @Delete('pages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a CMS page' })
  deletePage(@Param() { id }: UuidParamDto) {
    return this.cms.remove(id);
  }
}
