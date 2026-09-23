import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Initiates / completes the Google OAuth2 flow via the 'google' strategy. */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
