import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtRefreshPayload } from '@photography/types';
import type { JwtConfig } from '../../../config/configuration';

export interface RefreshRequestUser {
  payload: JwtRefreshPayload;
  refreshToken: string;
}

/** Validates the refresh token (read from the request body) and exposes the raw token for rotation. */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<JwtConfig>('jwt').refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): RefreshRequestUser {
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken;
    if (payload.type !== 'refresh' || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { payload, refreshToken };
  }
}
