import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Department } from '@prisma/client';
import { Paginated, PERMISSIONS } from '@cms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { DepartmentsService, DepartmentWithCounts } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.DEPARTMENT_READ)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryDepartmentDto,
  ): Promise<Paginated<DepartmentWithCounts>> {
    return this.departments.findAll(user, query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENT_READ)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DepartmentWithCounts> {
    return this.departments.findOne(user, id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.DEPARTMENT_CREATE)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDepartmentDto,
  ): Promise<Department> {
    return this.departments.create(user, dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENT_UPDATE)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<Department> {
    return this.departments.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENT_DELETE)
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Department> {
    return this.departments.deactivate(user, id);
  }
}
