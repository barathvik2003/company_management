import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '@cms/shared';

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Guards a route with a permission. The scope the caller holds it at is
 * resolved at request time and used to filter rows, not to allow/deny alone.
 */
export const RequirePermission = (permission: PermissionKey) =>
  SetMetadata(PERMISSION_KEY, permission);
