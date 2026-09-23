import type { PublicUser } from '@photography/types';
import { displayName } from '@photography/utils';
import { User } from './entities/user.entity';

/** Maps a User entity to the API-safe PublicUser shape (drops password hash etc.). */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: displayName(user.firstName, user.lastName, user.email),
    role: user.role,
    provider: user.provider,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
