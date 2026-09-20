import { PermissionScope } from '@cms/shared';

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: Array<{ key: string; scope: PermissionScope }>;
  /** Departments this user manages — the basis of DEPARTMENT scope. */
  managedDepartmentIds: string[];
  tokenVersion: number;
}
