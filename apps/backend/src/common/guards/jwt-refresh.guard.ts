import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Validates the refresh token via the 'jwt-refresh' strategy. */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
