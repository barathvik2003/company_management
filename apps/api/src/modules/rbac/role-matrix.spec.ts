import { PERMISSIONS, PermissionScope, ROLE_MATRIX, RoleName } from '@cms/shared';

const has = (role: RoleName, key: string) => ROLE_MATRIX[role].some((p) => p.key === key);
const scopeOf = (role: RoleName, key: string) =>
  ROLE_MATRIX[role].find((p) => p.key === key)?.scope;

describe('RBAC matrix', () => {
  it('gives the company head everything at company scope', () => {
    for (const grant of ROLE_MATRIX.COMPANY_HEAD) {
      expect(grant.scope).toBe(PermissionScope.COMPANY);
    }
    expect(ROLE_MATRIX.COMPANY_HEAD).toHaveLength(Object.values(PERMISSIONS).length);
  });

  it('never lets an employee read company-wide finance', () => {
    expect(has(RoleName.EMPLOYEE, PERMISSIONS.FINANCE_READ)).toBe(false);
    expect(has(RoleName.EMPLOYEE, PERMISSIONS.DASHBOARD_COMPANY)).toBe(false);
    expect(has(RoleName.EMPLOYEE, PERMISSIONS.AUDIT_READ)).toBe(false);
    expect(has(RoleName.EMPLOYEE, PERMISSIONS.USER_ASSIGN_ROLE)).toBe(false);
  });

  it('scopes every employee permission to their own records', () => {
    for (const grant of ROLE_MATRIX.EMPLOYEE) {
      expect(grant.scope).toBe(PermissionScope.OWN);
    }
  });

  it('gives managers department scope, not company scope', () => {
    expect(scopeOf(RoleName.MANAGER, PERMISSIONS.SALE_READ)).toBe(PermissionScope.DEPARTMENT);
    expect(scopeOf(RoleName.MANAGER, PERMISSIONS.EMPLOYEE_READ)).toBe(PermissionScope.DEPARTMENT);
    expect(has(RoleName.MANAGER, PERMISSIONS.FINANCE_READ)).toBe(false);
  });

  it('does not let admin post financial transactions', () => {
    expect(has(RoleName.ADMIN, PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(has(RoleName.ADMIN, PERMISSIONS.FINANCE_CREATE)).toBe(false);
    expect(has(RoleName.ADMIN, PERMISSIONS.FINANCE_UPDATE)).toBe(false);
  });

  it('does not let finance manage users', () => {
    expect(has(RoleName.FINANCE, PERMISSIONS.USER_CREATE)).toBe(false);
    expect(has(RoleName.FINANCE, PERMISSIONS.USER_ASSIGN_ROLE)).toBe(false);
    expect(has(RoleName.FINANCE, PERMISSIONS.FINANCE_CREATE)).toBe(true);
  });
});
