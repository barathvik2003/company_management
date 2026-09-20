import { ForbiddenException } from '@nestjs/common';
import { PERMISSIONS, PermissionScope } from '@cms/shared';
import { ScopeService } from './scope.service';
import { AuthenticatedUser } from '../types/authenticated-user';

const user = (
  scope: PermissionScope,
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser => ({
  id: 'user-1',
  companyId: 'company-1',
  email: 'a@b.com',
  firstName: 'A',
  lastName: 'B',
  roles: [],
  permissions: [{ key: PERMISSIONS.EMPLOYEE_READ, scope }],
  managedDepartmentIds: ['dept-1'],
  tokenVersion: 0,
  ...overrides,
});

describe('ScopeService', () => {
  const service = new ScopeService();

  it('limits COMPANY scope to the caller company', () => {
    const where = service.buildWhere(user(PermissionScope.COMPANY), PERMISSIONS.EMPLOYEE_READ, {
      ownerField: 'userId',
      departmentField: 'departmentId',
    });
    expect(where).toEqual({ companyId: 'company-1' });
  });

  it('limits DEPARTMENT scope to managed departments plus own records', () => {
    const where = service.buildWhere(user(PermissionScope.DEPARTMENT), PERMISSIONS.EMPLOYEE_READ, {
      ownerField: 'userId',
      departmentField: 'departmentId',
    });
    expect(where).toEqual({
      companyId: 'company-1',
      OR: [{ departmentId: { in: ['dept-1'] } }, { userId: 'user-1' }],
    });
  });

  it('limits OWN scope to the caller', () => {
    const where = service.buildWhere(user(PermissionScope.OWN), PERMISSIONS.EMPLOYEE_READ, {
      ownerField: 'userId',
    });
    expect(where).toEqual({ companyId: 'company-1', userId: 'user-1' });
  });

  it('refuses a permission the caller does not hold', () => {
    expect(() =>
      service.buildWhere(user(PermissionScope.OWN), PERMISSIONS.FINANCE_READ),
    ).toThrow(ForbiddenException);
  });

  it('blocks cross-company access even at COMPANY scope', () => {
    expect(() =>
      service.assertCanTouch(user(PermissionScope.COMPANY), PERMISSIONS.EMPLOYEE_READ, {
        companyId: 'other-company',
        ownerId: 'user-1',
        departmentId: 'dept-1',
      }),
    ).toThrow(ForbiddenException);
  });

  it('blocks a manager from touching another department', () => {
    expect(() =>
      service.assertCanTouch(user(PermissionScope.DEPARTMENT), PERMISSIONS.EMPLOYEE_READ, {
        companyId: 'company-1',
        ownerId: 'someone-else',
        departmentId: 'dept-99',
      }),
    ).toThrow(ForbiddenException);
  });

  it('allows an employee to touch their own record only', () => {
    const caller = user(PermissionScope.OWN);
    expect(() =>
      service.assertCanTouch(caller, PERMISSIONS.EMPLOYEE_READ, {
        companyId: 'company-1',
        ownerId: 'user-1',
        departmentId: null,
      }),
    ).not.toThrow();
    expect(() =>
      service.assertCanTouch(caller, PERMISSIONS.EMPLOYEE_READ, {
        companyId: 'company-1',
        ownerId: 'user-2',
        departmentId: null,
      }),
    ).toThrow(ForbiddenException);
  });
});
