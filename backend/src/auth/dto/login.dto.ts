import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phoneOrEmail!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
