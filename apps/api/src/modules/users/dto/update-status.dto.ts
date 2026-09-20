import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '@cms/shared';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus) status!: UserStatus;
  @IsOptional() @IsString() @MaxLength(200) reason?: string;
}
