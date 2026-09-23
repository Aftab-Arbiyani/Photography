import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import type { AuthTokens, JwtAccessPayload, JwtRefreshPayload } from '@photography/types';
import type { JwtConfig } from '../../config/configuration';
import type { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

interface IssueContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

/**
 * Owns all JWT signing/verification and refresh-token persistence + rotation.
 * Separated from AuthService (SRP) so token mechanics can be tested in isolation.
 */
@Injectable()
export class TokenService {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {
    this.jwtConfig = configService.getOrThrow<JwtConfig>('jwt');
  }

  private static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Issue a fresh access + refresh pair and persist the refresh-token record. */
  async issueTokens(user: User, ctx: IssueContext = {}): Promise<AuthTokens> {
    const jti = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      } satisfies JwtAccessPayload,
      { secret: this.jwtConfig.accessSecret, expiresIn: this.jwtConfig.accessExpiresIn },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti, type: 'refresh' } satisfies JwtRefreshPayload,
      { secret: this.jwtConfig.refreshSecret, expiresIn: this.jwtConfig.refreshExpiresIn },
    );

    const decoded = this.jwtService.decode(refreshToken) as { exp: number };
    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        id: jti,
        tokenHash: TokenService.hash(refreshToken),
        userId: user.id,
        expiresAt: new Date(decoded.exp * 1000),
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ipAddress ?? null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.expiresInSeconds(accessToken),
    };
  }

  /**
   * Validate a presented refresh token, detect reuse, and rotate.
   * Returns the row so the caller can load the user and issue a new pair.
   */
  async validateAndConsume(payload: JwtRefreshPayload, rawToken: string): Promise<RefreshToken> {
    const record = await this.refreshTokenRepository.findOne({ where: { id: payload.jti } });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection: a token already revoked is being replayed -> kill the chain.
    if (record.revokedAt) {
      await this.revokeAllForUser(record.userId);
      throw new UnauthorizedException('Refresh token reuse detected — all sessions revoked');
    }

    if (record.tokenHash !== TokenService.hash(rawToken) || !record.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return record;
  }

  /** Mark a refresh-token row as revoked, optionally linking its successor. */
  async revoke(record: RefreshToken, replacedByTokenId?: string): Promise<void> {
    record.revokedAt = new Date();
    if (replacedByTokenId) record.replacedByTokenId = replacedByTokenId;
    await this.refreshTokenRepository.save(record);
  }

  async revokeById(jti: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { id: jti, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  // ---- single-purpose tokens (email verification / password reset) ----

  signVerificationToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email, type: 'verify' },
      {
        secret: this.jwtConfig.verificationSecret,
        expiresIn: this.jwtConfig.verificationExpiresIn,
      },
    );
  }

  signResetToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email, type: 'reset' },
      { secret: this.jwtConfig.resetSecret, expiresIn: this.jwtConfig.resetExpiresIn },
    );
  }

  async verifyVerificationToken(token: string): Promise<{ sub: string; email: string }> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.jwtConfig.verificationSecret,
      });
    } catch {
      throw new UnauthorizedException('Verification link is invalid or has expired');
    }
  }

  async verifyResetToken(token: string): Promise<{ sub: string; email: string }> {
    try {
      return await this.jwtService.verifyAsync(token, { secret: this.jwtConfig.resetSecret });
    } catch {
      throw new UnauthorizedException('Reset link is invalid or has expired');
    }
  }

  /** Extract the persisted-row id (jti) from a signed refresh token. */
  getRefreshJti(refreshToken: string): string {
    const decoded = this.jwtService.decode(refreshToken) as JwtRefreshPayload | null;
    if (!decoded?.jti) throw new UnauthorizedException('Malformed refresh token');
    return decoded.jti;
  }

  private expiresInSeconds(accessToken: string): number {
    const decoded = this.jwtService.decode(accessToken) as { exp: number; iat: number };
    return decoded.exp - decoded.iat;
  }
}
