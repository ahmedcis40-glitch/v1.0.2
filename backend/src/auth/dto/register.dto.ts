import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  whatsappPhone?: string;

  @IsString()
  @IsOptional()
  kycDocuments?: string;

  @IsBoolean()
  @IsOptional()
  consentSMS?: boolean;

  @IsBoolean()
  @IsOptional()
  consentWhatsApp?: boolean;
}
