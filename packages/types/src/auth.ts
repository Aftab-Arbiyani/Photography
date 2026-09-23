import type { UserRole } from './enums';
import type { PublicUser } from './user';

/** Decoded JWT access-token payload. */
export interface JwtAccessPayload {
  /** subject — user id */
  sub: string;
  email: string;
  role: UserRole;
  /** token type discriminator */
  type: 'access';
  iat?: number;
  exp?: number;
}

/** Decoded JWT refresh-token payload. */
export interface JwtRefreshPayload {
  sub: string;
  /** opaque id of the persisted refresh-token row, used for rotation/revocation */
  jti: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}
