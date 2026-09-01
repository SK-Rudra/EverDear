import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  Request,
  Response,
} from 'express';
import { AUTH_COOKIE_NAME } from './auth.constants.js';
import type { CreatedAuthSession } from './auth.types.js';

@Injectable()
export class AuthCookieService {
  private readonly secureCookies: boolean;

  constructor(configService: ConfigService) {
    this.secureCookies =
      configService.get<string>('NODE_ENV') ===
      'production';
  }

  setSessionCookie(
    response: Response,
    session: CreatedAuthSession,
  ): void {
    response.cookie(
      AUTH_COOKIE_NAME,
      session.token,
      {
        httpOnly: true,
        secure: this.secureCookies,
        sameSite: 'lax',
        path: '/',
        expires: session.expiresAt,
      },
    );

    response.setHeader('Cache-Control', 'no-store');
  }

  clearSessionCookie(response: Response): void {
    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: 'lax',
      path: '/',
    });

    response.setHeader('Cache-Control', 'no-store');
  }

  getSessionToken(request: Request): unknown {
    const cookies = request.cookies as
      | Record<string, unknown>
      | undefined;

    return cookies?.[AUTH_COOKIE_NAME];
  }
}