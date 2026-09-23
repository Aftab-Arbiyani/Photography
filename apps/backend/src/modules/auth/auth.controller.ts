import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AppConfig, GoogleConfig } from '../../config/configuration';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import type { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/password.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/token.dto';
import type { RefreshRequestUser } from './strategies/jwt-refresh.strategy';

const GENERIC_OK = { message: 'If the request is valid, you will receive an email shortly.' };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private context(req: Request) {
    return {
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
    };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ResponseMessage('Registration successful — please verify your email')
  @ApiOperation({ summary: 'Register a new account (email + password)' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.context(req));
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ResponseMessage('Logged in')
  @ApiOperation({ summary: 'Log in with email + password' })
  login(@CurrentUser() user: User, @Req() req: Request) {
    return this.authService.login(user, this.context(req));
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed')
  @ApiOperation({ summary: 'Exchange a refresh token for a new access/refresh pair (rotating)' })
  refresh(@Req() req: Request, @Body() _dto: RefreshTokenDto) {
    const { payload, refreshToken } = req.user as unknown as RefreshRequestUser;
    return this.authService.refresh(payload, refreshToken, this.context(req));
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the supplied refresh token (single session)' })
  async logout(@Body() dto: RefreshTokenDto) {
    // Decoding only — no secret needed; revocation is by jti.
    const [, payloadB64] = dto.refreshToken.split('.');
    const jti = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()).jti as string;
    await this.authService.logout(jti);
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke every active session for the current user' })
  logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  // ---- email verification ----

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Email verified')
  @ApiOperation({ summary: 'Verify an email address with the token from the email link' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOkResponse({ schema: { example: GENERIC_OK } })
  @ApiOperation({ summary: 'Resend the email-verification link' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto.email);
    return GENERIC_OK;
  }

  // ---- password reset ----

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOkResponse({ schema: { example: GENERIC_OK } })
  @ApiOperation({ summary: 'Request a password-reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return GENERIC_OK;
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password has been reset')
  @ApiOperation({ summary: 'Reset the password using the emailed token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password changed')
  @ApiOperation({ summary: 'Change password while authenticated' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  // ---- Google OAuth ----

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Begin the Google OAuth2 flow (redirects to Google)' })
  googleAuth() {
    // Guard handles the redirect to Google's consent screen.
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth2 callback — issues tokens and redirects to the frontend' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as unknown as Parameters<AuthService['validateOAuthLogin']>[0];
    const result = await this.authService.validateOAuthLogin(profile, this.context(req));
    const frontendUrl = this.configService.getOrThrow<AppConfig>('app').frontendUrl;
    const url = new URL('/auth/callback', frontendUrl);
    url.searchParams.set('accessToken', result.tokens.accessToken);
    url.searchParams.set('refreshToken', result.tokens.refreshToken);
    res.redirect(url.toString());
  }

  // expose google availability so the frontend can hide the button when disabled
  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'List enabled auth providers' })
  providers() {
    const google = this.configService.getOrThrow<GoogleConfig>('google');
    return { local: true, google: google.enabled };
  }
}
