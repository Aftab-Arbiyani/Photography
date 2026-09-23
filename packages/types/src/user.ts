import type { AuthProvider, UserRole } from './enums';

/** User shape safe to expose over the API (no password hash, no tokens). */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  role: UserRole;
  provider: AuthProvider;
  avatarUrl: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
