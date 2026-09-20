import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Paginated, PERMISSIONS } from '@cms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { EmployeeRecord, EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.EMPLOYEE_READ)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryEmployeeDto,
  ): Promise<Paginated<EmployeeRecord>> {
    return this.employees.findAll(user, query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.EMPLOYEE_READ)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeRecord> {
    return this.employees.findOne(user, id);
  }

  @Get(':id/summary')
  @RequirePermission(PERMISSIONS.EMPLOYEE_READ)
  summary(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.employees.summary(user, id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.EMPLOYEE_CREATE)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmployeeDto,
  ): Promise<EmployeeRecord> {
    return this.employees.create(user, dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.EMPLOYEE_UPDATE)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeRecord> {
    return this.employees.update(user, id, dto);
  }
}
