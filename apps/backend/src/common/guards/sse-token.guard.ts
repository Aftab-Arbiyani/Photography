import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtAccessPayload } from '@photography/types';
import type { JwtConfig } from '../../config/configuration';

/**
 * Authenticates Server-Sent Events connections via a `?token=` query param
 * (EventSource cannot send an Authorization header). Runs as a guard so an
 * invalid token yields a clean 401 BEFORE the SSE response stream is opened.
 */
@Injectable()
export class SseTokenGuard implements CanActivate {
  private readonly accessSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<JwtConfig>('jwt').accessSecret;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = (req.query?.token as string | undefined) ?? '';
    try {
      const payload = this.jwtService.verify<JwtAccessPayload>(token, {
        secret: this.accessSecret,
      });
      if (payload.type !== 'access') throw new Error('wrong token type');
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or missing token');
    }
  }
}
