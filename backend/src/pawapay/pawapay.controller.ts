import { Controller, Post, Body, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PawaPayService } from './pawapay.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@Controller('pawapay')
export class PawaPayController {
  constructor(private readonly pawapayService: PawaPayService) {}

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  async deposit(@GetUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.pawapayService.initiateDeposit(user.id, dto);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(@GetUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.pawapayService.initiateWithdrawal(user.id, dto);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async callback(
    @Headers('x-pawapay-signature') signature: string | undefined,
    @Body() payload: any,
  ) {
    return this.pawapayService.handleCallback(signature, payload);
  }
}
