"use strict";
/**
 * Mirrors of the Prisma enums.
 * The web app cannot import @prisma/client (it must never touch the DB layer),
 * so both sides import these instead. Keep in sync with prisma/schema.prisma.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyStatus = exports.DepartmentStatus = exports.EmploymentStatus = exports.UserStatus = exports.PermissionScope = exports.RoleName = void 0;
exports.RoleName = {
    COMPANY_HEAD: 'COMPANY_HEAD',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    FINANCE: 'FINANCE',
};
exports.PermissionScope = {
    OWN: 'OWN',
    DEPARTMENT: 'DEPARTMENT',
    COMPANY: 'COMPANY',
};
exports.UserStatus = {
    INVITED: 'INVITED',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    DEACTIVATED: 'DEACTIVATED',
};
exports.EmploymentStatus = {
    PROBATION: 'PROBATION',
    PERMANENT: 'PERMANENT',
    CONTRACT: 'CONTRACT',
    INTERN: 'INTERN',
    RESIGNED: 'RESIGNED',
    TERMINATED: 'TERMINATED',
};
exports.DepartmentStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
};
exports.CompanyStatus = {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
};
//# sourceMappingURL=enums.js.map