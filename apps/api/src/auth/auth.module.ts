import { Module } from '@nestjs/common';
import { AuthCookieService } from './auth-cookie.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { SessionAuthGuard } from './session-auth.guard.js';
import { SessionService } from './session.service.js';
import { SessionTokenService } from './session-token.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCookieService,
    PasswordService,
    SessionTokenService,
    SessionService,
    SessionAuthGuard,
  ],
  exports: [
    SessionAuthGuard,
    SessionService,
  ],
})
export class AuthModule {}