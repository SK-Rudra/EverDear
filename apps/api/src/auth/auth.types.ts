import type { UserRole } from '../generated/prisma/enums.js';

export type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

export type CreatedAuthSession = {
  token: string;
  expiresAt: Date;
};

export type ResolvedAuthSession = {
  id: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

export type AuthenticationResult = {
  user: AuthenticatedUser;
  session: CreatedAuthSession;
};

export type AuthenticationResponse = {
  user: AuthenticatedUser;
};