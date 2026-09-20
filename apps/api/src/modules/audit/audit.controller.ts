import { Controller, Get, Query } from '@nestjs/common';
import { Paginated, PERMISSIONS } from '@cms/shared';
import { AuditLog } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, safeSort } from '../../common/utils/paginate';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AUDIT_READ)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<AuditLog>> {
    const where = {
      companyId: user.companyId,
      ...(query.search
        ? {
            OR: [
              { summary: { contains: query.search, mode: 'insensitive' as const } },
              { entity: { contains: query.search, mode: 'insensitive' as const } },
              { actorEmail: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const sortBy = safeSort(query.sortBy, ['createdAt', 'action', 'entity'], 'createdAt');
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }
}
