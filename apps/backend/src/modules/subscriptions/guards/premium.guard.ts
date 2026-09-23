import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request';
import { SubscriptionsService } from '../subscriptions.service';

export const REQUIRES_PREMIUM = 'requiresPremium';

/** Marks a route as premium-only. Combine with PremiumGuard. */
export const RequiresPremium = () => SetMetadata(REQUIRES_PREMIUM, true);

/**
 * Allows the request only if the authenticated user has an active premium plan.
 * Runs after JwtAuthGuard, so `request.user` is present. No-op when the route
 * isn't marked @RequiresPremium.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRES_PREMIUM, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !(await this.subscriptions.isPremium(user.id))) {
      throw new ForbiddenException('This feature requires an active premium membership');
    }
    return true;
  }
}
