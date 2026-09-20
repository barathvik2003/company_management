import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(10, { message: 'New password must be at least 10 characters' })
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'New password needs a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'New password needs an uppercase letter' })
  @Matches(/[0-9]/, { message: 'New password needs a number' })
  newPassword!: string;
}
