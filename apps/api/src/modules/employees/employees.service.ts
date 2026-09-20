import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Paginated, PERMISSIONS, PermissionScope } from '@cms/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../../common/utils/scope.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { paginate, safeSort } from '../../common/utils/paginate';
import { BCRYPT_ROUNDS } from '../auth/auth.constants';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

/**
 * Note the select lists below: passwordHash is never among them. Selecting
 * explicitly, rather than excluding, means a new sensitive column added later
 * cannot leak by accident.
 */
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  roles: { select: { role: { select: { name: true, label: true } } } },
} satisfies Prisma.UserSelect;

const EMPLOYEE_INCLUDE = {
  user: { select: USER_SELECT },
  department: { select: { id: true, name: true, code: true } },
  reportsTo: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.EmployeeProfileInclude;

export type EmployeeRecord = Prisma.EmployeeProfileGetPayload<{ include: typeof EMPLOYEE_INCLUDE }>;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  async findAll(user: AuthenticatedUser, query: QueryEmployeeDto): Promise<Paginated<EmployeeRecord>> {
    const scoped = this.scope.buildWhere(user, PERMISSIONS.EMPLOYEE_READ, {
      ownerField: 'userId',
      departmentField: 'departmentId',
    });

    const where: Prisma.EmployeeProfileWhereInput = {
      ...(scoped as Prisma.EmployeeProfileWhereInput),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.employmentStatus ? { employmentStatus: query.employmentStatus } : {}),
      ...(query.userStatus ? { user: { status: query.userStatus } } : {}),
      ...(query.search
        ? {
            OR: [
              { employeeCode: { contains: query.search, mode: 'insensitive' } },
              { designation: { contains: query.search, mode: 'insensitive' } },
              { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
              { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
              { user: { email: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const sortBy = safeSort(query.sortBy, ['employeeCode', 'createdAt', 'designation'], 'employeeCode');
    const [items, total] = await this.prisma.$transaction([
      this.prisma.employeeProfile.findMany({
        where,
        include: EMPLOYEE_INCLUDE,
        orderBy: { [sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.employeeProfile.count({ where }),
    ]);

    return paginate(items, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<EmployeeRecord> {
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id, companyId: user.companyId },
      include: EMPLOYEE_INCLUDE,
    });
    if (!employee) throw new NotFoundException('Employee not found');
    this.scope.assertCanTouch(user, PERMISSIONS.EMPLOYEE_READ, {
      companyId: employee.companyId,
      departmentId: employee.departmentId,
      ownerId: employee.userId,
    });
    return employee;
  }

  /**
   * Creating an employee writes to three tables. A transaction means we never
   * end up with a login that has no profile, or a profile with no roles.
   */
  async create(user: AuthenticatedUser, dto: CreateEmployeeDto): Promise<EmployeeRecord> {
    await this.assertDepartmentInCompany(user, dto.departmentId);
    if (this.scope.scopeOf(user, PERMISSIONS.EMPLOYEE_CREATE) === PermissionScope.DEPARTMENT) {
      if (!dto.departmentId || !user.managedDepartmentIds.includes(dto.departmentId)) {
        throw new BadRequestException('You may only add employees to your own department');
      }
    }

    const roles = await this.prisma.role.findMany({ where: { name: { in: dto.roles } } });
    if (roles.length !== dto.roles.length) throw new BadRequestException('Unknown role supplied');

    const passwordHash = await bcrypt.hash(dto.temporaryPassword, BCRYPT_ROUNDS);

    const employee = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          companyId: user.companyId,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone ?? null,
          mustChangePassword: true,
          createdById: user.id,
          updatedById: user.id,
          roles: {
            create: roles.map((role) => ({ roleId: role.id, assignedBy: user.id })),
          },
          employeeProfile: {
            create: {
              companyId: user.companyId,
              employeeCode: dto.employeeCode,
              departmentId: dto.departmentId ?? null,
              designation: dto.designation ?? null,
              reportsToId: dto.reportsToId ?? null,
              joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
              employmentStatus: dto.employmentStatus ?? 'PERMANENT',
              location: dto.location ?? null,
            },
          },
        },
        select: { employeeProfile: { select: { id: true } } },
      });

      const profileId = created.employeeProfile?.id;
      if (!profileId) throw new Error('Employee profile was not created');

      return tx.employeeProfile.findUniqueOrThrow({
        where: { id: profileId },
        include: EMPLOYEE_INCLUDE,
      });
    });

    await this.audit.record({
      companyId: user.companyId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.CREATE,
      entity: 'Employee',
      entityId: employee.id,
      summary: `Employee ${dto.firstName} ${dto.lastName} (${dto.employeeCode}) created`,
      metadata: { roles: dto.roles, departmentId: dto.departmentId },
    });

    return employee;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateEmployeeDto): Promise<EmployeeRecord> {
    const existing = await this.findOne(user, id);
    this.scope.assertCanTouch(user, PERMISSIONS.EMPLOYEE_UPDATE, {
      companyId: existing.companyId,
      departmentId: existing.departmentId,
      ownerId: existing.userId,
    });
    await this.assertDepartmentInCompany(user, dto.departmentId);

    const { firstName, lastName, phone, ...profileFields } = dto;

    const employee = await this.prisma.$transaction(async (tx) => {
      if (firstName || lastName || phone !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
            ...(phone !== undefined ? { phone } : {}),
            updatedById: user.id,
          },
        });
      }
      return tx.employeeProfile.update({
        where: { id: existing.id },
        data: {
          ...profileFields,
          ...(profileFields.joiningDate ? { joiningDate: new Date(profileFields.joiningDate) } : {}),
        },
        include: EMPLOYEE_INCLUDE,
      });
    });

    await this.audit.record({
      companyId: user.companyId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.UPDATE,
      entity: 'Employee',
      entityId: employee.id,
      summary: `Employee ${employee.employeeCode} updated`,
      metadata: { changed: Object.keys(dto) },
    });

    return employee;
  }

  /** The full picture used by the employee profile screen. */
  async summary(user: AuthenticatedUser, id: string) {
    const employee = await this.findOne(user, id);
    const recentActivity = await this.prisma.auditLog.findMany({
      where: { companyId: user.companyId, actorId: employee.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, action: true, entity: true, summary: true, createdAt: true },
    });

    return {
      employee,
      recentActivity,
      // Filled in by later phases; the shape is fixed now so the UI is stable.
      targets: [],
      sales: [],
      customers: [],
      tasks: [],
      weeklyUpdates: [],
    };
  }

  private async assertDepartmentInCompany(
    user: AuthenticatedUser,
    departmentId?: string,
  ): Promise<void> {
    if (!departmentId) return;
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, companyId: user.companyId },
      select: { id: true },
    });
    if (!department) throw new BadRequestException('The selected department does not exist');
  }
}
