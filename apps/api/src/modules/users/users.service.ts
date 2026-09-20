import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { Paginated, RoleName, UserStatus } from '@cms/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { paginate, safeSort } from '../../common/utils/paginate';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  lastLoginAt: true,
  mustChangePassword: true,
  createdAt: true,
  roles: { select: { role: { select: { name: true, label: true } } } },
  employeeProfile: {
    select: { id: true, employeeCode: true, designation: true, department: { select: { id: true, name: true } } },
  },
} satisfies Prisma.UserSelect;

export type UserRecord = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(user: AuthenticatedUser, query: PaginationQueryDto): Promise<Paginated<UserRecord>> {
    const where: Prisma.UserWhereInput = {
      companyId: user.companyId,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const sortBy = safeSort(query.sortBy, ['createdAt', 'email', 'firstName', 'status'], 'createdAt');
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { [sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<UserRecord> {
    const record = await this.prisma.user.findFirst({
      where: { id, companyId: user.companyId },
      select: USER_SELECT,
    });
    if (!record) throw new NotFoundException('User not found');
    return record;
  }

  /**
   * Role changes are the highest-risk operation in the system, so they run in a
   * transaction, are always audited, and cannot be used to lock everyone out.
   */
  async assignRoles(actor: AuthenticatedUser, id: string, dto: AssignRolesDto): Promise<UserRecord> {
    const target = await this.findOne(actor, id);
    if (target.id === actor.id && !dto.roles.includes(RoleName.COMPANY_HEAD)) {
      throw new ForbiddenException('You cannot remove your own company head role');
    }
    await this.assertNotLastCompanyHead(actor.companyId, target.id, dto.roles);

    const roles = await this.prisma.role.findMany({ where: { name: { in: dto.roles } } });
    if (roles.length !== dto.roles.length) throw new BadRequestException('Unknown role supplied');

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: target.id } }),
      this.prisma.userRole.createMany({
        data: roles.map((role) => ({ userId: target.id, roleId: role.id, assignedBy: actor.id })),
      }),
      // Force a fresh token so revoked permissions stop working immediately.
      this.prisma.user.update({
        where: { id: target.id },
        data: { tokenVersion: { increment: 1 }, updatedById: actor.id },
      }),
    ]);

    await this.audit.record({
      companyId: actor.companyId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.ROLE_CHANGE,
      entity: 'User',
      entityId: target.id,
      summary: `Roles for ${target.email} set to ${dto.roles.join(', ')}`,
      metadata: {
        from: target.roles.map((r) => r.role.name),
        to: dto.roles,
      },
    });

    return this.findOne(actor, id);
  }

  async updateStatus(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserRecord> {
    const target = await this.findOne(actor, id);
    if (target.id === actor.id && dto.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    if (dto.status !== UserStatus.ACTIVE) {
      await this.assertNotLastCompanyHead(actor.companyId, target.id, []);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: target.id },
        data: { status: dto.status, tokenVersion: { increment: 1 }, updatedById: actor.id },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      companyId: actor.companyId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.STATUS_CHANGE,
      entity: 'User',
      entityId: target.id,
      summary: `${target.email} set to ${dto.status}`,
      metadata: { reason: dto.reason },
    });

    return this.findOne(actor, id);
  }

  /** A company must always retain one active company head. */
  private async assertNotLastCompanyHead(
    companyId: string,
    targetUserId: string,
    nextRoles: string[],
  ): Promise<void> {
    if (nextRoles.includes(RoleName.COMPANY_HEAD)) return;
    const others = await this.prisma.user.count({
      where: {
        companyId,
        status: UserStatus.ACTIVE,
        id: { not: targetUserId },
        roles: { some: { role: { name: RoleName.COMPANY_HEAD } } },
      },
    });
    if (others === 0) {
      throw new BadRequestException(
        'This is the only active company head. Assign the role to someone else first.',
      );
    }
  }
}
