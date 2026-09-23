import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request';
import { FeatureFlagsService } from '../feature-flags.service';

export const FEATURE_FLAG_KEY = 'featureFlag';

/** Gate a route behind a feature flag: @RequireFeature('new-checkout'). */
export const RequireFeature = (key: string) => SetMetadata(FEATURE_FLAG_KEY, key);

/**
 * Blocks access when the route's feature flag is disabled (404, so the feature
 * appears not to exist). Percentage rollout is keyed by the authenticated user.
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!key) return true;
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!(await this.featureFlags.isEnabled(key, user?.id))) {
      throw new NotFoundException('Not found');
    }
    return true;
  }
}
