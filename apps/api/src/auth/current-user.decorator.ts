import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './authenticated-request.js';
import type { AuthenticatedUser } from './auth.types.js';

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser => {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    if (!request.auth) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    return request.auth.user;
  },
);