import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsEmail, IsEnum, IsIn, IsOptional,
  IsString, IsUUID, Matches, MaxLength, MinLength,
} from 'class-validator';
import { EmploymentStatus, RoleName } from '@cms/shared';

export class CreateEmployeeDto {
  @IsString() @MinLength(1) @MaxLength(60) firstName!: string;
  @IsString() @MinLength(1) @MaxLength(60) lastName!: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @MaxLength(180)
  email!: string;

  @IsOptional() @IsString() @MaxLength(30) phone?: string;

  @IsString()
  @Matches(/^[A-Z0-9-]{2,20}$/, { message: 'Employee code may use capitals, numbers and hyphens' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  employeeCode!: string;

  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsString() @MaxLength(80) designation?: string;
  @IsOptional() @IsUUID() reportsToId?: string;
  @IsOptional() @IsDateString() joiningDate?: string;
  @IsOptional() @IsEnum(EmploymentStatus) employmentStatus?: EmploymentStatus;
  @IsOptional() @IsString() @MaxLength(120) location?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Assign at least one role' })
  @ArrayUnique()
  @Type(() => String)
  @IsIn(Object.values(RoleName), { each: true })
  roles!: string[];

  /**
   * Temporary password. The user is forced to change it at first sign-in.
   */
  @IsString()
  @MinLength(10, { message: 'Temporary password must be at least 10 characters' })
  @MaxLength(128)
  temporaryPassword!: string;
}
