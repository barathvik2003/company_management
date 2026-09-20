import { PERMISSIONS } from '@cms/shared';

export interface NavItem {
  href: string;
  label: string;
  /**
   * Hidden unless the caller holds this permission. The API enforces it too.
   * Omit it for items every signed-in person may open.
   */
  permission?: string;
  phase?: number;
}

/**
 * The sidebar is built from permissions, not role names, so a custom role
 * automatically gets the right menu without changing this file.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/employees', label: 'Employees', permission: PERMISSIONS.EMPLOYEE_READ },
  { href: '/departments', label: 'Departments', permission: PERMISSIONS.DEPARTMENT_READ },
  { href: '/sales', label: 'Sales', permission: PERMISSIONS.SALE_READ, phase: 2 },
  { href: '/targets', label: 'Targets', permission: PERMISSIONS.TARGET_READ, phase: 2 },
  { href: '/customers', label: 'Customers', permission: PERMISSIONS.CUSTOMER_READ, phase: 3 },
  { href: '/projects', label: 'Projects', permission: PERMISSIONS.PROJECT_READ, phase: 4 },
  { href: '/finance', label: 'Finance', permission: PERMISSIONS.FINANCE_READ, phase: 5 },
  { href: '/reports', label: 'Reports', permission: PERMISSIONS.REPORT_READ, phase: 7 },
  { href: '/audit', label: 'Audit log', permission: PERMISSIONS.AUDIT_READ },
];
