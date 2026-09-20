import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(400) address?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(180) email?: string;
  @IsOptional() @IsUrl() @MaxLength(200) website?: string;
  @IsOptional() @IsString() @MaxLength(60) timezone?: string;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
}
