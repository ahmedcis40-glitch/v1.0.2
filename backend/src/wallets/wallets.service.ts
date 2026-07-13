import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getCashWallet(userId: string) {
    const wallet = await this.prisma.cashWallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException('CashWallet non trouvé pour cet utilisateur');
    }
    return wallet;
  }

  async getSecuritiesWallet(userId: string) {
    return this.prisma.securitiesWallet.findMany({
      where: { userId },
    });
  }

  async getTransactions(userId: string) {
    return this.prisma.pawaPayTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
