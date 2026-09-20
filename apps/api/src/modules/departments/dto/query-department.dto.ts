import { IsEnum, IsOptional } from 'class-validator';
import { DepartmentStatus } from '@cms/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryDepartmentDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(DepartmentStatus) status?: DepartmentStatus;
}
