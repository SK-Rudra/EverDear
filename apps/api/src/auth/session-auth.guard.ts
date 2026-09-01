import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCookieService } from './auth-cookie.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { SessionService } from './session.service.js';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly cookieService: AuthCookieService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const token =
      this.cookieService.getSessionToken(request);

    const session =
      await this.sessionService.resolveSession(token);

    if (!session) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    request.auth = session;

    return true;
  }
}