import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('cash')
  async getCashWallet(@GetUser() user: User) {
    return this.walletsService.getCashWallet(user.id);
  }

  @Get('securities')
  async getSecuritiesWallet(@GetUser() user: User) {
    return this.walletsService.getSecuritiesWallet(user.id);
  }

  @Get('transactions')
  async getTransactions(@GetUser() user: User) {
    return this.walletsService.getTransactions(user.id);
  }
}
