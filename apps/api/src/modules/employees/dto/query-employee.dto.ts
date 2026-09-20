import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EmploymentStatus, UserStatus } from '@cms/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryEmployeeDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsEnum(EmploymentStatus) employmentStatus?: EmploymentStatus;
  @IsOptional() @IsEnum(UserStatus) userStatus?: UserStatus;
}
