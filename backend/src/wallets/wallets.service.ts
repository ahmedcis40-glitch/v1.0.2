import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getCashWallet(userId: string) {
    const wallet = await this.prisma.cashWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("Portefeuille cash introuvable.");
    }

    const available = wallet.balanceTotal - wallet.balanceFrozen;
    return {
      ...wallet,
      balanceAvailable: available >= 0 ? available : 0,
    };
  }

  async getSecuritiesWallet(userId: string) {
    return this.prisma.securitiesWallet.findMany({
      where: { userId },
      orderBy: { codeValeur: 'asc' },
    });
  }

  async getTransactions(userId: string) {
    return this.prisma.pawaPayTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async depositCash(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException("Le montant doit être supérieur à zéro.");
    }

    const wallet = await this.prisma.cashWallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException("Portefeuille cash introuvable.");
    }

    return this.prisma.cashWallet.update({
      where: { userId },
      data: {
        balanceTotal: wallet.balanceTotal + amount,
        updatedAt: new Date(),
      },
    });
  }

  async withdrawCash(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException("Le montant doit être supérieur à zéro.");
    }

    const wallet = await this.prisma.cashWallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException("Portefeuille cash introuvable.");
    }

    const available = wallet.balanceTotal - wallet.balanceFrozen;
    if (available < amount) {
      throw new BadRequestException("Solde disponible insuffisant pour effectuer ce retrait.");
    }

    return this.prisma.cashWallet.update({
      where: { userId },
      data: {
        balanceTotal: wallet.balanceTotal - amount,
        updatedAt: new Date(),
      },
    });
  }

  async freezeCash(userId: string, amount: number) {
    const wallet = await this.prisma.cashWallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException("Portefeuille cash introuvable.");
    }

    const available = wallet.balanceTotal - wallet.balanceFrozen;
    if (available < amount) {
      throw new BadRequestException("Solde disponible insuffisant pour effectuer cet achat.");
    }

    return this.prisma.cashWallet.update({
      where: { userId },
      data: {
        balanceFrozen: wallet.balanceFrozen + amount,
        updatedAt: new Date(),
      },
    });
  }

  async unfreezeCash(userId: string, amount: number) {
    const wallet = await this.prisma.cashWallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException("Portefeuille cash introuvable.");
    }

    const newFrozen = Math.max(0, wallet.balanceFrozen - amount);

    return this.prisma.cashWallet.update({
      where: { userId },
      data: {
        balanceFrozen: newFrozen,
        updatedAt: new Date(),
      },
    });
  }

  async debitFrozenCash(userId: string, realAmount: number, estimatedAmountFrozen: number) {
    const wallet = await this.prisma.cashWallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException("Portefeuille cash introuvable.");
    }

    const newTotal = wallet.balanceTotal - realAmount;
    const newFrozen = Math.max(0, wallet.balanceFrozen - estimatedAmountFrozen);

    if (newTotal < 0) {
      throw new BadRequestException("Le solde total ne peut pas devenir négatif.");
    }

    return this.prisma.cashWallet.update({
      where: { userId },
      data: {
        balanceTotal: newTotal,
        balanceFrozen: newFrozen,
        updatedAt: new Date(),
      },
    });
  }

  async addSecurities(userId: string, codeValeur: string, quantity: number, buyPrice: number) {
    const existing = await this.prisma.securitiesWallet.findUnique({
      where: {
        userId_codeValeur: { userId, codeValeur },
      },
    });

    if (existing) {
      const totalQty = existing.quantity + quantity;
      const totalCost = (existing.quantity * existing.averageBuyPrice) + (quantity * buyPrice);
      const newAveragePrice = totalCost / totalQty;

      return this.prisma.securitiesWallet.update({
        where: {
          userId_codeValeur: { userId, codeValeur },
        },
        data: {
          quantity: totalQty,
          averageBuyPrice: newAveragePrice,
          updatedAt: new Date(),
        },
      });
    } else {
      return this.prisma.securitiesWallet.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          codeValeur,
          quantity,
          averageBuyPrice: buyPrice,
          updatedAt: new Date(),
        },
      });
    }
  }

  async removeSecurities(userId: string, codeValeur: string, quantity: number) {
    const existing = await this.prisma.securitiesWallet.findUnique({
      where: {
        userId_codeValeur: { userId, codeValeur },
      },
    });

    if (!existing || existing.quantity < quantity) {
      throw new BadRequestException("Quantité de titres insuffisante dans le portefeuille.");
    }

    const newQuantity = existing.quantity - quantity;

    if (newQuantity === 0) {
      return this.prisma.securitiesWallet.delete({
        where: {
          userId_codeValeur: { userId, codeValeur },
        },
      });
    } else {
      return this.prisma.securitiesWallet.update({
        where: {
          userId_codeValeur: { userId, codeValeur },
        },
        data: {
          quantity: newQuantity,
          updatedAt: new Date(),
        },
      });
    }
  }
}
