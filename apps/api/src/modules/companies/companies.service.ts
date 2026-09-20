import { Injectable } from '@nestjs/common';
import { AuditAction, Company } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findMine(user: AuthenticatedUser): Promise<Company> {
    return this.prisma.company.findUniqueOrThrow({ where: { id: user.companyId } });
  }

  async update(user: AuthenticatedUser, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: { ...dto },
    });
    await this.audit.record({
      companyId: user.companyId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.UPDATE,
      entity: 'Company',
      entityId: company.id,
      summary: `Company profile updated`,
      metadata: { changed: Object.keys(dto) },
    });
    return company;
  }
}
