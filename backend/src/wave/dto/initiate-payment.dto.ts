import { IsNotEmpty, IsNumber, IsString, IsPositive } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
