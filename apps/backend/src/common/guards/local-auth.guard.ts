import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Validates email/password credentials via the 'local' strategy. */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
