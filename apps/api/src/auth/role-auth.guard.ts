import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../generated/prisma/enums.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { REQUIRED_ROLES_METADATA } from './require-roles.decorator.js';

@Injectable()
export class RoleAuthGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<
        UserRole[]
      >(REQUIRED_ROLES_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    if (!request.auth) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    if (
      !requiredRoles.includes(
        request.auth.user.role,
      )
    ) {
      throw new ForbiddenException(
        'Staff access required',
      );
    }

    return true;
  }
}