import { Request } from 'express';
import { AuthenticatedUser } from './auth-user.type';

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
