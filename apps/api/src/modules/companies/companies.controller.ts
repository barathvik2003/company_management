import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Company } from '@prisma/client';
import { PERMISSIONS } from '@cms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('company')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.COMPANY_READ)
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<Company> {
    return this.companies.findMine(user);
  }

  @Patch()
  @RequirePermission(PERMISSIONS.COMPANY_UPDATE)
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCompanyDto): Promise<Company> {
    return this.companies.update(user, dto);
  }
}
