import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Paginated, PERMISSIONS } from '@cms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UserRecord, UsersService } from './users.service';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.USER_READ)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<UserRecord>> {
    return this.users.findAll(user, query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.USER_READ)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserRecord> {
    return this.users.findOne(user, id);
  }

  @Patch(':id/roles')
  @RequirePermission(PERMISSIONS.USER_ASSIGN_ROLE)
  assignRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolesDto,
  ): Promise<UserRecord> {
    return this.users.assignRoles(user, id, dto);
  }

  @Patch(':id/status')
  @RequirePermission(PERMISSIONS.USER_UPDATE)
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserRecord> {
    return this.users.updateStatus(user, id, dto);
  }
}
