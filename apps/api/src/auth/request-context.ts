import type { Request } from 'express';
import type { SessionMetadata } from './auth.types.js';

export function getSessionMetadata(
  request: Request,
): SessionMetadata {
  const metadata: SessionMetadata = {};

  const userAgent = request.get('user-agent');

  if (userAgent) {
    metadata.userAgent = userAgent;
  }

  if (request.ip) {
    metadata.ipAddress = request.ip;
  }

  return metadata;
}