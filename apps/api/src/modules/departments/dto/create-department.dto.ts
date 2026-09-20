import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { DepartmentStatus } from '@cms/shared';

export class CreateDepartmentDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;

  @IsString()
  @Matches(/^[A-Z0-9_-]{2,20}$/, {
    message: 'Code may use capital letters, numbers, hyphen and underscore only',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code!: string;

  @IsOptional() @IsString() @MaxLength(400) description?: string;
  @IsOptional() @IsUUID() managerId?: string;
  @IsOptional() @IsEnum(DepartmentStatus) status?: DepartmentStatus;
}
