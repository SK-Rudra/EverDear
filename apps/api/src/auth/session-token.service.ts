import {
  createHash,
  randomBytes,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  SESSION_TOKEN_BYTES,
  SESSION_TOKEN_LENGTH,
} from './auth.constants.js';

export type CreatedSessionToken = {
  token: string;
  tokenHash: string;
};

@Injectable()
export class SessionTokenService {
  createSessionToken(): CreatedSessionToken {
    const token = randomBytes(
      SESSION_TOKEN_BYTES,
    ).toString('base64url');

    return {
      token,
      tokenHash: this.hashSessionToken(token),
    };
  }

  hashSessionToken(token: string): string {
    return createHash('sha256')
      .update(token, 'utf8')
      .digest('hex');
  }

  isValidSessionToken(token: unknown): token is string {
    return (
      typeof token === 'string' &&
      token.length === SESSION_TOKEN_LENGTH &&
      /^[A-Za-z0-9_-]+$/.test(token)
    );
  }
}