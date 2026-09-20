import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionKey, PermissionScope } from '@cms/shared';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Turns "what may this person see?" into a Prisma `where` fragment.
 *
 * This is the heart of row-level security. A manager cannot widen their view by
 * editing a request, because the filter is built from the token, never from
 * query parameters.
 */
@Injectable()
export class ScopeService {
  scopeOf(user: AuthenticatedUser, permission: PermissionKey): PermissionScope {
    const granted = user.permissions.find((p) => p.key === permission);
    if (!granted) throw new ForbiddenException(`Missing permission: ${permission}`);
    return granted.scope;
  }

  /**
   * Builds a filter for records that carry a companyId and an owning user id.
   * `ownerField` is the column holding the owning user (e.g. "userId").
   * `departmentField` is the column holding the department (e.g. "departmentId").
   */
  buildWhere(
    user: AuthenticatedUser,
    permission: PermissionKey,
    fields: { ownerField?: string; departmentField?: string } = {},
  ): Record<string, unknown> {
    const scope = this.scopeOf(user, permission);
    const base: Record<string, unknown> = { companyId: user.companyId };

    if (scope === PermissionScope.COMPANY) return base;

    if (scope === PermissionScope.DEPARTMENT) {
      if (!fields.departmentField) return { ...base, [fields.ownerField ?? 'userId']: user.id };
      return {
        ...base,
        OR: [
          { [fields.departmentField]: { in: user.managedDepartmentIds } },
          { [fields.ownerField ?? 'userId']: user.id },
        ],
      };
    }

    return { ...base, [fields.ownerField ?? 'userId']: user.id };
  }

  /** Throws unless the caller may act on this specific owner/department pair. */
  assertCanTouch(
    user: AuthenticatedUser,
    permission: PermissionKey,
    record: { ownerId?: string | null; departmentId?: string | null; companyId: string },
  ): void {
    if (record.companyId !== user.companyId) {
      throw new ForbiddenException('Record belongs to another company');
    }
    const scope = this.scopeOf(user, permission);
    if (scope === PermissionScope.COMPANY) return;
    if (scope === PermissionScope.DEPARTMENT) {
      const inDept = record.departmentId
        ? user.managedDepartmentIds.includes(record.departmentId)
        : false;
      if (inDept || record.ownerId === user.id) return;
      throw new ForbiddenException('Record is outside your department');
    }
    if (record.ownerId === user.id) return;
    throw new ForbiddenException('You may only act on your own records');
  }
}
