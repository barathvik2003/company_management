import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS, PermissionScope } from '@cms/shared';
import { PermissionsGuard } from './permissions.guard';
import { AuthenticatedUser } from '../types/authenticated-user';

const contextFor = (user?: AuthenticatedUser): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

const caller: AuthenticatedUser = {
  id: 'u1',
  companyId: 'c1',
  email: 'e@e.com',
  firstName: 'E',
  lastName: 'E',
  roles: ['EMPLOYEE'],
  permissions: [{ key: PERMISSIONS.SALE_CREATE, scope: PermissionScope.OWN }],
  managedDepartmentIds: [],
  tokenVersion: 0,
};

describe('PermissionsGuard', () => {
  function guardRequiring(permission: string | undefined, isPublic = false): PermissionsGuard {
    const reflector = {
      getAllAndOverride: (key: string) => (key === 'isPublic' ? isPublic : permission),
    } as unknown as Reflector;
    return new PermissionsGuard(reflector);
  }

  it('allows public routes without a user', () => {
    expect(guardRequiring(undefined, true).canActivate(contextFor())).toBe(true);
  });

  it('allows a route the caller has permission for', () => {
    expect(guardRequiring(PERMISSIONS.SALE_CREATE).canActivate(contextFor(caller))).toBe(true);
  });

  it('rejects a route the caller lacks permission for', () => {
    expect(() =>
      guardRequiring(PERMISSIONS.FINANCE_CREATE).canActivate(contextFor(caller)),
    ).toThrow(ForbiddenException);
  });

  it('rejects an unauthenticated caller on a guarded route', () => {
    expect(() => guardRequiring(PERMISSIONS.SALE_CREATE).canActivate(contextFor())).toThrow(
      ForbiddenException,
    );
  });
});
