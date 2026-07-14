import { Controller, Post, Body, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { WaveService } from './wave.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@Controller('wave')
export class WaveController {
  constructor(private readonly waveService: WaveService) {}

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  async deposit(@GetUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.waveService.initiateDeposit(user.id, dto);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(@GetUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.waveService.initiateWithdrawal(user.id, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async callback(
    @Headers('x-wave-signature') signature: string | undefined,
    @Body() payload: any,
  ) {
    return this.waveService.handleWebhook(signature, payload);
  }
}
