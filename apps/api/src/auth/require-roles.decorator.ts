import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../generated/prisma/enums.js';

export const REQUIRED_ROLES_METADATA =
  'everdear:required-roles';

export const RequireRoles = (
  ...roles: UserRole[]
) =>
  SetMetadata(
    REQUIRED_ROLES_METADATA,
    roles,
  );