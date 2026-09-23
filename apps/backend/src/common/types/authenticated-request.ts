import type { Request } from 'express';
import type { UserRole } from '@photography/types';

/** The principal attached to the request by the JWT strategy. */
export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
