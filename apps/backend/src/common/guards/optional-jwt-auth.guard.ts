import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authenticates when a valid token is present but DOES NOT reject anonymous
 * requests. Used on public read endpoints that enrich the response for logged-in
 * users (e.g. `likedByMe`).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override to swallow the "no token" error and return `undefined` user instead.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user as TUser;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
