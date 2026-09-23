import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsPage } from './entities/cms-page.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { PlatformSetting } from './entities/platform-setting.entity';
import { CmsService } from './cms.service';
import { EmailTemplatesService } from './email-templates.service';
import { FeatureFlagsService } from './feature-flags.service';
import { SettingsService } from './settings.service';
import { FeatureFlagGuard } from './guards/feature-flag.guard';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformPublicController } from './platform-public.controller';

/**
 * Global so SettingsService / FeatureFlagsService can be injected anywhere
 * (e.g. a feature-flag guard on another module's route) without re-importing.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PlatformSetting, FeatureFlag, EmailTemplate, CmsPage])],
  controllers: [PlatformPublicController, PlatformAdminController],
  providers: [
    SettingsService,
    FeatureFlagsService,
    EmailTemplatesService,
    CmsService,
    FeatureFlagGuard,
  ],
  exports: [
    SettingsService,
    FeatureFlagsService,
    EmailTemplatesService,
    CmsService,
    FeatureFlagGuard,
  ],
})
export class PlatformModule {}
