import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';

/** Email, password and roles are changed through their own dedicated endpoints. */
export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['email', 'temporaryPassword', 'roles'] as const),
) {}
