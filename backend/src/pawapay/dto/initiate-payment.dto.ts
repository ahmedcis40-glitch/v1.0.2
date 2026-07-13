import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  phone!: string; // ex: "2250700000000"

  @IsString()
  @IsNotEmpty()
  correspondent!: string; // ex: "ORANGE_CI", "MTN_CI", "MOOV_CI", "WAVE_CI"
}
