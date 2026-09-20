/**
 * Mirrors of the Prisma enums.
 * The web app cannot import @prisma/client (it must never touch the DB layer),
 * so both sides import these instead. Keep in sync with prisma/schema.prisma.
 */

export const RoleName = {
  COMPANY_HEAD: 'COMPANY_HEAD',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  FINANCE: 'FINANCE',
} as const;
export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const PermissionScope = {
  OWN: 'OWN',
  DEPARTMENT: 'DEPARTMENT',
  COMPANY: 'COMPANY',
} as const;
export type PermissionScope = (typeof PermissionScope)[keyof typeof PermissionScope];

export const UserStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const EmploymentStatus = {
  PROBATION: 'PROBATION',
  PERMANENT: 'PERMANENT',
  CONTRACT: 'CONTRACT',
  INTERN: 'INTERN',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED',
} as const;
export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus];

export const DepartmentStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type DepartmentStatus = (typeof DepartmentStatus)[keyof typeof DepartmentStatus];

export const CompanyStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];
