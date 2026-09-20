"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_MATRIX = exports.ALL_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.describePermission = describePermission;
const enums_1 = require("./enums");
/**
 * The permission catalogue. Keys are "resource:action".
 * Every permission for every phase is declared here so the seed creates them
 * once; later phases simply start enforcing the ones they need.
 */
exports.PERMISSIONS = {
    // Phase 1
    COMPANY_READ: 'company:read',
    COMPANY_UPDATE: 'company:update',
    DEPARTMENT_READ: 'department:read',
    DEPARTMENT_CREATE: 'department:create',
    DEPARTMENT_UPDATE: 'department:update',
    DEPARTMENT_DELETE: 'department:delete',
    USER_READ: 'user:read',
    USER_CREATE: 'user:create',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    USER_ASSIGN_ROLE: 'user:assign-role',
    EMPLOYEE_READ: 'employee:read',
    EMPLOYEE_CREATE: 'employee:create',
    EMPLOYEE_UPDATE: 'employee:update',
    AUDIT_READ: 'audit:read',
    SETTING_READ: 'setting:read',
    SETTING_UPDATE: 'setting:update',
    // Phase 2+ (created now, enforced later)
    TARGET_READ: 'target:read',
    TARGET_CREATE: 'target:create',
    TARGET_UPDATE: 'target:update',
    SALE_READ: 'sale:read',
    SALE_CREATE: 'sale:create',
    SALE_UPDATE: 'sale:update',
    PENDING_SALE_READ: 'pending-sale:read',
    PENDING_SALE_CREATE: 'pending-sale:create',
    CUSTOMER_READ: 'customer:read',
    CUSTOMER_CREATE: 'customer:create',
    CUSTOMER_UPDATE: 'customer:update',
    FOLLOW_UP_READ: 'follow-up:read',
    FOLLOW_UP_CREATE: 'follow-up:create',
    FOLLOW_UP_UPDATE: 'follow-up:update',
    PROJECT_READ: 'project:read',
    PROJECT_CREATE: 'project:create',
    PROJECT_UPDATE: 'project:update',
    TASK_READ: 'task:read',
    TASK_CREATE: 'task:create',
    TASK_UPDATE: 'task:update',
    WEEKLY_UPDATE_READ: 'weekly-update:read',
    WEEKLY_UPDATE_CREATE: 'weekly-update:create',
    WEEKLY_UPDATE_REVIEW: 'weekly-update:review',
    FINANCE_READ: 'finance:read',
    FINANCE_CREATE: 'finance:create',
    FINANCE_UPDATE: 'finance:update',
    REPORT_READ: 'report:read',
    DASHBOARD_COMPANY: 'dashboard:company',
    DASHBOARD_MANAGER: 'dashboard:manager',
    DASHBOARD_EMPLOYEE: 'dashboard:employee',
    DASHBOARD_FINANCE: 'dashboard:finance',
    AI_READ: 'ai:read',
    AI_APPROVE: 'ai:approve',
};
exports.ALL_PERMISSIONS = Object.values(exports.PERMISSIONS);
const company = (keys) => keys.map((key) => ({ key, scope: enums_1.PermissionScope.COMPANY }));
const department = (keys) => keys.map((key) => ({ key, scope: enums_1.PermissionScope.DEPARTMENT }));
const own = (keys) => keys.map((key) => ({ key, scope: enums_1.PermissionScope.OWN }));
const P = exports.PERMISSIONS;
/**
 * The RBAC matrix. This is the single source of truth: the seed writes it to
 * the database, the docs render from it, and the tests assert against it.
 */
exports.ROLE_MATRIX = {
    COMPANY_HEAD: company(exports.ALL_PERMISSIONS),
    ADMIN: [
        ...company([
            P.COMPANY_READ, P.COMPANY_UPDATE,
            P.DEPARTMENT_READ, P.DEPARTMENT_CREATE, P.DEPARTMENT_UPDATE, P.DEPARTMENT_DELETE,
            P.USER_READ, P.USER_CREATE, P.USER_UPDATE, P.USER_DELETE, P.USER_ASSIGN_ROLE,
            P.EMPLOYEE_READ, P.EMPLOYEE_CREATE, P.EMPLOYEE_UPDATE,
            P.AUDIT_READ, P.SETTING_READ, P.SETTING_UPDATE,
            P.TARGET_READ, P.SALE_READ, P.PENDING_SALE_READ,
            P.CUSTOMER_READ, P.FOLLOW_UP_READ,
            P.PROJECT_READ, P.TASK_READ, P.WEEKLY_UPDATE_READ,
            P.REPORT_READ, P.DASHBOARD_COMPANY,
            // Admin sees financial summaries but cannot post transactions.
            P.FINANCE_READ,
        ]),
    ],
    MANAGER: [
        ...department([
            P.DEPARTMENT_READ, P.EMPLOYEE_READ, P.USER_READ,
            P.TARGET_READ, P.TARGET_CREATE, P.TARGET_UPDATE,
            P.SALE_READ, P.SALE_CREATE, P.SALE_UPDATE,
            P.PENDING_SALE_READ, P.PENDING_SALE_CREATE,
            P.CUSTOMER_READ, P.CUSTOMER_CREATE, P.CUSTOMER_UPDATE,
            P.FOLLOW_UP_READ, P.FOLLOW_UP_CREATE, P.FOLLOW_UP_UPDATE,
            P.PROJECT_READ, P.PROJECT_CREATE, P.PROJECT_UPDATE,
            P.TASK_READ, P.TASK_CREATE, P.TASK_UPDATE,
            P.WEEKLY_UPDATE_READ, P.WEEKLY_UPDATE_REVIEW,
            P.REPORT_READ, P.AI_READ,
        ]),
        ...own([P.DASHBOARD_MANAGER, P.WEEKLY_UPDATE_CREATE, P.DASHBOARD_EMPLOYEE]),
    ],
    EMPLOYEE: own([
        P.DASHBOARD_EMPLOYEE,
        P.TARGET_READ,
        P.SALE_READ, P.SALE_CREATE,
        P.PENDING_SALE_READ, P.PENDING_SALE_CREATE,
        P.CUSTOMER_READ, P.CUSTOMER_UPDATE,
        P.FOLLOW_UP_READ, P.FOLLOW_UP_CREATE, P.FOLLOW_UP_UPDATE,
        P.PROJECT_READ, P.TASK_READ, P.TASK_UPDATE,
        P.WEEKLY_UPDATE_READ, P.WEEKLY_UPDATE_CREATE,
    ]),
    FINANCE: [
        ...company([
            P.FINANCE_READ, P.FINANCE_CREATE, P.FINANCE_UPDATE,
            P.DASHBOARD_FINANCE, P.REPORT_READ,
            P.PROJECT_READ, P.CUSTOMER_READ, P.DEPARTMENT_READ, P.EMPLOYEE_READ,
            P.SALE_READ,
        ]),
        ...own([P.WEEKLY_UPDATE_CREATE, P.DASHBOARD_EMPLOYEE]),
    ],
};
/** Human labels, used by the seed and the settings screen. */
function describePermission(key) {
    const [resource = key, action = 'access'] = key.split(':');
    const pretty = (value) => value.replace(/-/g, ' ');
    return {
        resource,
        action,
        label: `${pretty(action).charAt(0).toUpperCase()}${pretty(action).slice(1)} ${pretty(resource)}`,
    };
}
//# sourceMappingURL=permissions.js.map