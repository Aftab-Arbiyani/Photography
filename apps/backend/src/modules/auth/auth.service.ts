import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  AuthProvider,
  type AuthResult,
  type AuthTokens,
  type JwtRefreshPayload,
  UserRole,
} from '@photography/types';
import { MailService } from '../../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { toPublicUser } from '../users/user.mapper';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';

export interface GoogleProfile {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface RequestContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB (OWASP recommended floor)
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  // ---- registration ----

  async register(dto: RegisterDto, ctx: RequestContext): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      role: UserRole.USER,
      provider: AuthProvider.LOCAL,
      isEmailVerified: false,
    });

    await this.sendVerification(user);
    const tokens = await this.tokenService.issueTokens(user, ctx);
    return { user: toPublicUser(user), tokens };
  }

  // ---- credential validation (used by LocalStrategy) ----

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email.toLowerCase());
    // Constant-ish behavior: don't reveal which factor failed.
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async login(user: User, ctx: RequestContext): Promise<AuthResult> {
    const tokens = await this.tokenService.issueTokens(user, ctx);
    await this.usersService.recordLogin(user.id);
    return { user: toPublicUser(user), tokens };
  }

  // ---- refresh rotation ----

  async refresh(
    payload: JwtRefreshPayload,
    rawToken: string,
    ctx: RequestContext,
  ): Promise<AuthTokens> {
    const record = await this.tokenService.validateAndConsume(payload, rawToken);
    const user = await this.usersService.getByIdOrThrow(record.userId);

    const tokens = await this.tokenService.issueTokens(user, ctx);
    // Link old -> new and revoke the consumed token (rotation).
    await this.tokenService.revoke(record, this.tokenService.getRefreshJti(tokens.refreshToken));
    return tokens;
  }

  async logout(refreshJti: string): Promise<void> {
    await this.tokenService.revokeById(refreshJti);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllForUser(userId);
  }

  // ---- email verification ----

  async verifyEmail(token: string): Promise<void> {
    const { sub } = await this.tokenService.verifyVerificationToken(token);
    const user = await this.usersService.getByIdOrThrow(sub);
    if (!user.isEmailVerified) {
      await this.usersService.markEmailVerified(user.id);
      await this.mailService.sendWelcomeEmail(user.email, user.displayName);
    }
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    // Silent on unknown / already-verified to avoid user enumeration.
    if (user && !user.isEmailVerified) {
      await this.sendVerification(user);
    }
  }

  private async sendVerification(user: User): Promise<void> {
    const token = await this.tokenService.signVerificationToken(user.id, user.email);
    await this.mailService.sendVerificationEmail(user.email, user.displayName, token);
  }

  // ---- password reset ----

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    // Always behave identically regardless of account existence.
    if (user && user.provider === AuthProvider.LOCAL) {
      const token = await this.tokenService.signResetToken(user.id, user.email);
      await this.mailService.sendPasswordResetEmail(user.email, user.displayName, token);
    } else {
      this.logger.debug(`Password reset requested for non-resettable account: ${email}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { sub } = await this.tokenService.verifyResetToken(token);
    const user = await this.usersService.getByIdOrThrow(sub);
    const passwordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);
    await this.usersService.updatePassword(user.id, passwordHash);
    // Invalidate every existing session after a password reset.
    await this.tokenService.revokeAllForUser(user.id);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByEmailWithPassword(
      (await this.usersService.getByIdOrThrow(userId)).email,
    );
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, currentPassword))) {
      throw new BadRequestException('Current password is incorrect');
    }
    const passwordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.tokenService.revokeAllForUser(user.id);
  }

  // ---- Google OAuth ----

  async validateOAuthLogin(profile: GoogleProfile, ctx: RequestContext): Promise<AuthResult> {
    let user = await this.usersService.findByGoogleId(profile.googleId);

    if (!user) {
      // Link to an existing local account with the same email, else create one.
      const byEmail = await this.usersService.findByEmail(profile.email.toLowerCase());
      if (byEmail) {
        user = byEmail;
      } else {
        user = await this.usersService.create({
          email: profile.email,
          firstName: profile.firstName ?? null,
          lastName: profile.lastName ?? null,
          avatarUrl: profile.avatarUrl ?? null,
          googleId: profile.googleId,
          provider: AuthProvider.GOOGLE,
          isEmailVerified: true, // Google has verified the address
        });
      }
    }

    const tokens = await this.tokenService.issueTokens(user, ctx);
    await this.usersService.recordLogin(user.id);
    return { user: toPublicUser(user), tokens };
  }
}
