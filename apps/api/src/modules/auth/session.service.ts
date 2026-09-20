import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionScope, UserStatus } from '@cms/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

/**
 * Loads the caller's live identity on every request.
 *
 * Permissions deliberately are NOT read from the JWT: if an admin revokes a
 * role, the change takes effect on the next request rather than whenever the
 * token happens to expire.
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async load(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        companyId: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        tokenVersion: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: {
                  select: { scope: true, permission: { select: { key: true } } },
                },
              },
            },
          },
        },
        managesDepartments: { select: { id: true } },
      },
    });

    if (!user) throw new UnauthorizedException('Session is no longer valid');
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    // When two roles grant the same permission, the widest scope wins.
    const rank: Record<string, number> = { OWN: 0, DEPARTMENT: 1, COMPANY: 2 };
    const merged = new Map<string, PermissionScope>();
    for (const { role } of user.roles) {
      for (const grant of role.permissions) {
        const key = grant.permission.key;
        const current = merged.get(key);
        const next = grant.scope as PermissionScope;
        if (!current || (rank[next] ?? 0) > (rank[current] ?? 0)) merged.set(key, next);
      }
    }

    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((r) => r.role.name),
      permissions: [...merged].map(([key, scope]) => ({ key, scope })),
      managedDepartmentIds: user.managesDepartments.map((d) => d.id),
      tokenVersion: user.tokenVersion,
    };
  }
}
