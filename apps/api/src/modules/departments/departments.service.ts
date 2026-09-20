import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Department, Prisma } from '@prisma/client';
import { Paginated, PERMISSIONS } from '@cms/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../../common/utils/scope.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { paginate, safeSort } from '../../common/utils/paginate';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';

export type DepartmentWithCounts = Department & {
  manager: { id: string; firstName: string; lastName: string; email: string } | null;
  _count: { employees: number };
};

const MANAGER_SELECT = { id: true, firstName: true, lastName: true, email: true } as const;

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  async findAll(
    user: AuthenticatedUser,
    query: QueryDepartmentDto,
  ): Promise<Paginated<DepartmentWithCounts>> {
    const scoped = this.scope.buildWhere(user, PERMISSIONS.DEPARTMENT_READ, {
      ownerField: 'managerId',
      departmentField: 'id',
    });

    const where: Prisma.DepartmentWhereInput = {
      ...(scoped as Prisma.DepartmentWhereInput),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortBy = safeSort(query.sortBy, ['name', 'code', 'createdAt', 'status'], 'name');
    const [items, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        include: { manager: { select: MANAGER_SELECT }, _count: { select: { employees: true } } },
        orderBy: { [sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.department.count({ where }),
    ]);

    return paginate(items, total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<DepartmentWithCounts> {
    const department = await this.prisma.department.findFirst({
      where: { id, companyId: user.companyId },
      include: { manager: { select: MANAGER_SELECT }, _count: { select: { employees: true } } },
    });
    if (!department) throw new NotFoundException('Department not found');
    this.scope.assertCanTouch(user, PERMISSIONS.DEPARTMENT_READ, {
      companyId: department.companyId,
      departmentId: department.id,
      ownerId: department.managerId,
    });
    return department;
  }

  async create(user: AuthenticatedUser, dto: CreateDepartmentDto): Promise<Department> {
    await this.assertManagerBelongsToCompany(user, dto.managerId);

    const department = await this.prisma.department.create({
      data: {
        companyId: user.companyId,
        name: dto.name,
        code: dto.code,
        description: dto.description ?? null,
        managerId: dto.managerId ?? null,
        status: dto.status ?? 'ACTIVE',
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await this.audit.record({
      companyId: user.companyId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.CREATE,
      entity: 'Department',
      entityId: department.id,
      summary: `Department ${department.name} created`,
    });

    return department;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const existing = await this.findOne(user, id);
    await this.assertManagerBelongsToCompany(user, dto.managerId);

    const department = await this.prisma.department.update({
      where: { id: existing.id },
      data: { ...dto, updatedById: user.id },
    });

    await this.audit.record({
      companyId: user.companyId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.UPDATE,
      entity: 'Department',
      entityId: department.id,
      summary: `Department ${department.name} updated`,
      metadata: { changed: Object.keys(dto) },
    });

    return department;
  }

  /** Departments are deactivated, never deleted: their history must survive. */
  async deactivate(user: AuthenticatedUser, id: string): Promise<Department> {
    const existing = await this.findOne(user, id);
    if (existing._count.employees > 0) {
      throw new BadRequestException(
        'Move the employees in this department first, then deactivate it.',
      );
    }
    const department = await this.prisma.department.update({
      where: { id: existing.id },
      data: { status: 'INACTIVE', updatedById: user.id },
    });
    await this.audit.record({
      companyId: user.companyId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.STATUS_CHANGE,
      entity: 'Department',
      entityId: department.id,
      summary: `Department ${department.name} deactivated`,
    });
    return department;
  }

  private async assertManagerBelongsToCompany(
    user: AuthenticatedUser,
    managerId?: string,
  ): Promise<void> {
    if (!managerId) return;
    const manager = await this.prisma.user.findFirst({
      where: { id: managerId, companyId: user.companyId },
      select: { id: true },
    });
    if (!manager) throw new BadRequestException('The selected manager is not in your company');
  }
}
