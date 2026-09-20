import { ArrayMinSize, ArrayUnique, IsArray, IsIn } from 'class-validator';
import { RoleName } from '@cms/shared';

export class AssignRolesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'A user must keep at least one role' })
  @ArrayUnique()
  @IsIn(Object.values(RoleName), { each: true })
  roles!: string[];
}
