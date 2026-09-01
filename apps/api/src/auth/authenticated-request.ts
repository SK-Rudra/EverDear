import type { Request } from 'express';
import type { ResolvedAuthSession } from './auth.types.js';

export type AuthenticatedRequest = Request & {
  auth?: ResolvedAuthSession;
};