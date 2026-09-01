import { Injectable } from '@nestjs/common';
import {
  createHash,
  randomBytes,
} from 'node:crypto';

const SHARE_TOKEN_BYTES = 32;
const SHARE_TOKEN_LENGTH = 43;

const SHARE_TOKEN_PATTERN =
  /^[a-zA-Z0-9_-]+$/;

export type CreatedShareToken = {
  token: string;
  tokenHash: string;
  tokenPrefix: string;
};

@Injectable()
export class ShareTokenService {
  create(): CreatedShareToken {
    const token = randomBytes(
      SHARE_TOKEN_BYTES,
    ).toString('base64url');

    return {
      token,
      tokenHash: this.hash(token),
      tokenPrefix: token.slice(0, 12),
    };
  }

  hash(token: string): string {
    return createHash('sha256')
      .update(token, 'utf8')
      .digest('hex');
  }

  hasValidFormat(token: string): boolean {
    return (
      token.length === SHARE_TOKEN_LENGTH &&
      SHARE_TOKEN_PATTERN.test(token)
    );
  }
}